import React, { useState, useEffect } from "react";
import Header from "../components/Header/Header";
import { Button } from "../components/ui/button";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalComplaints: 0,
    resolvedComplaints: 0,
    pendingComplaints: 0,
  });
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [activeTab, setActiveTab] = useState("stats");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    localStorage.setItem("user", JSON.stringify({
  name: "Admin",
  email: "admin@test.com",
  role: "admin",
  token: "demo-token"
}));
    const fetchData = async () => {
      try {
        const storedUser = JSON.parse(localStorage.getItem("user"));
        const config = storedUser?.token
          ? { headers: { Authorization: `Bearer ${storedUser.token}` } }
          : {};
        const statsRes = await axios.get(
          "http://localhost:8000/api/admin/stats",
          config,
        );
        setStats(statsRes.data);

        const usersRes = await axios.get(
          "http://localhost:8000/api/admin/users",
          config,
        );
        setUsers(usersRes.data);

        const logsRes = await axios.get(
          "http://localhost:8000/api/admin/logs",
          config,
        );
        setLogs(logsRes.data);
      } catch (error) {
        console.error("Error fetching admin data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const deleteUser = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      const storedUser = JSON.parse(localStorage.getItem("user"));
      const config = storedUser?.token
    ? { headers: { Authorization: `Bearer ${storedUser.token}` } }
    : {};

      await axios.delete(`http://localhost:8000/api/admin/users/${id}`, config);
      setUsers(users.filter((user) => user._id !== id));
      alert("User deleted");
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Failed to delete user");
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          Admin Dashboard
        </h1>

        <div className="flex gap-4 mb-8">
          <button
            className={`px-4 py-2 rounded-md font-medium ${activeTab === "stats" ? "bg-blue-600 text-white" : "bg-white text-gray-700 border border-gray-300"}`}
            onClick={() => setActiveTab("stats")}
          >
            Overview
          </button>
          <button
            className={`px-4 py-2 rounded-md font-medium ${activeTab === "users" ? "bg-blue-600 text-white" : "bg-white text-gray-700 border border-gray-300"}`}
            onClick={() => setActiveTab("users")}
          >
            Manage Users
          </button>
          <button
            className={`px-4 py-2 rounded-md font-medium ${activeTab === "logs" ? "bg-blue-600 text-white" : "bg-white text-gray-700 border border-gray-300"}`}
            onClick={() => setActiveTab("logs")}
          >
            System Logs
          </button>
        </div>

        {activeTab === "stats" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center">
              <h3 className="text-gray-500 mb-2">Total Users</h3>
              <p className="text-4xl font-bold text-blue-600">
                {stats.totalUsers}
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center">
              <h3 className="text-gray-500 mb-2">Total Complaints</h3>
              <p className="text-4xl font-bold text-gray-800">
                {stats.totalComplaints}
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center">
              <h3 className="text-gray-500 mb-2">Resolved</h3>
              <p className="text-4xl font-bold text-green-600">
                {stats.resolvedComplaints}
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center">
              <h3 className="text-gray-500 mb-2">Pending</h3>
              <p className="text-4xl font-bold text-yellow-600">
                {stats.pendingComplaints}
              </p>
            </div>
          </div>
        )}

        {activeTab === "users" && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-sm font-semibold text-gray-600">
                    Name
                  </th>
                  <th className="px-6 py-3 text-sm font-semibold text-gray-600">
                    Email
                  </th>
                  <th className="px-6 py-3 text-sm font-semibold text-gray-600">
                    Role
                  </th>
                  <th className="px-6 py-3 text-sm font-semibold text-gray-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-800">
                      {user.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${user.role === "admin" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-700"}`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {user.role !== "admin" && (
                        <button
                          onClick={() => deleteUser(user._id)}
                          className="text-red-600 hover:text-red-800 font-medium"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "logs" && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-sm font-semibold text-gray-600">
                    Time
                  </th>
                  <th className="px-6 py-3 text-sm font-semibold text-gray-600">
                    Admin
                  </th>
                  <th className="px-6 py-3 text-sm font-semibold text-gray-600">
                    Action
                  </th>
                  <th className="px-6 py-3 text-sm font-semibold text-gray-600">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.length > 0 ? (
                  logs.map((log) => (
                    <tr key={log._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-800">
                        {log.user_id ? log.user_id.name : "Unknown"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-800">
                        {log.action}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {log.details}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="4"
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      No logs found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
