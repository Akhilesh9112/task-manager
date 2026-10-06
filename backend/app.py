import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from supabase import create_client, Client
from dotenv import load_dotenv # or python-dotenv
import smtplib
from email.message import EmailMessage

load_dotenv()

app = Flask(__name__)
CORS(app)

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)

# Helper function to send email notifications via Gmail
def send_gmail_notification(to_email, subject, body):
    sender_email = os.environ.get("GMAIL_USER")
    sender_password = os.environ.get("GMAIL_APP_PASSWORD")
    
    msg = EmailMessage()
    msg.set_content(body)
    msg['Subject'] = subject
    msg['From'] = sender_email
    msg['To'] = to_email
    
    try:
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as smtp:
            smtp.login(sender_email, sender_password)
            smtp.send_message(msg)
        print("Email sent successfully!")
    except Exception as e:
        print(f"Error sending email: {e}")

@app.route("/api/users", methods=["GET"])
def get_users():
    response = supabase.table("profiles").select("*").execute()
    return jsonify(response.data), 200

@app.route("/api/tasks", methods=["GET"])
def get_tasks():
    user_id = request.args.get("user_id")
    response = supabase.table("tasks").select("*, assigned_to(email, name), created_by(email, name)").or_(f"created_by.eq.{user_id},assigned_to.eq.{user_id}").execute()
    return jsonify(response.data), 200

@app.route("/api/tasks", methods=["POST"])
def create_task():
    data = request.json
    title = data.get("title")
    description = data.get("description")
    created_by = data.get("created_by")
    assigned_to = data.get("assigned_to")

    # Insert task into Supabase
    response = supabase.table("tasks").insert({
        "title": title,
        "description": description,
        "created_by": created_by,
        "assigned_to": assigned_to,
        "status": "pending"
    }).execute()

    # Fetch assignee email to send notification
    assignee = supabase.table("profiles").select("email").eq("id", assigned_to).single().execute()
    if assignee.data:
        send_gmail_notification(
            assignee.data["email"],
            "New Task Assigned",
            f"You have been assigned a new task: '{title}'.\nDescription: {description}"
        )

    return jsonify(response.data), 201

@app.route("/api/tasks/<task_id>", methods=["PATCH"])
def update_task_status(task_id):
    data = request.json
    status = data.get("status")
    
    response = supabase.table("tasks").update({"status": status}).eq("id", task_id).execute()
    
    # If task is completed, notify creator
    if status == "completed":
        task_info = supabase.table("tasks").select("title, created_by(email)").eq("id", task_id).single().execute()
        if task_info.data and task_info.data.get("created_by"):
            creator_email = task_info.data["created_by"]["email"]
            send_gmail_notification(
                creator_email,
                "Task Completed",
                f"The task '{task_info.data['title']}' has been marked as completed."
            )

    return jsonify(response.data), 200

if __name__ == "__main__":
    app.run(debug=True, port=5001)