'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabase';
import { useRouter } from 'next/navigation';

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  created_by: { email: string; name: string };
  assigned_to: { email: string; name: string };
}

interface UserProfile {
  id: string;
  email: string;
  name: string;
}

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const router = useRouter();

  useEffect(() => {
    async function getUserAndData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      setUser(session.user);

      const resTasks = await fetch(`http://localhost:5001/api/tasks?user_id=${session.user.id}`);
      const tasksData = await resTasks.json();
      setTasks(tasksData);

      const resUsers = await fetch('http://localhost:5001/api/users');
      const usersData = await resUsers.json();
      setUsers(usersData);
    }
    getUserAndData();
  }, [router]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('http://localhost:5001/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        description,
        created_by: user.id,
        assigned_to: assignedTo,
      }),
    });

    if (res.ok) {
      setTitle('');
      setDescription('');
      window.location.reload();
    }
  };

  const updateStatus = async (taskId: string, status: string) => {
    await fetch(`http://localhost:5001/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    window.location.reload();
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Task Management Dashboard</h1>
      
      <form onSubmit={handleCreateTask} className="bg-white p-6 shadow rounded-lg mb-8 space-y-4">
        <h2 className="text-xl font-semibold">Create New Task</h2>
        <input
          type="text"
          placeholder="Task Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full p-2 border rounded"
        />
        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-2 border rounded"
        />
        <select
          value={assignedTo}
          onChange={(e) => setAssignedTo(e.target.value)}
          required
          className="w-full p-2 border rounded"
        >
          <option value="">Assign to User</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>{u.name || u.email}</option>
          ))}
        </select>
        <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">Create & Notify</button>
      </form>

      <h2 className="text-2xl font-semibold mb-4">Your Tasks</h2>
      <div className="space-y-4">
        {tasks.map((task) => (
          <div key={task.id} className="p-4 bg-white shadow rounded-lg flex justify-between items-center">
            <div>
              <h3 className="font-bold text-lg">{task.title}</h3>
              <p className="text-gray-600">{task.description}</p>
              <p className="text-sm text-gray-400">Status: <span className="font-semibold">{task.status}</span></p>
            </div>
            <div>
              {task.status !== 'completed' && (
                <button
                  onClick={() => updateStatus(task.id, 'completed')}
                  className="bg-blue-500 text-white px-3 py-1 rounded text-sm mr-2"
                >
                  Mark Completed
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}