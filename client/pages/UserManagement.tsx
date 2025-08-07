import React, { useState, useEffect } from "react";
import { Header } from "../components/Header";
import { AddUserModal } from "../components/AddUserModal";
import { EditUserModal } from "../components/EditUserModal";
import { cn } from "@/lib/utils";
import { authDelete } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Plus,
  Search,
  Edit2,
  Trash2,
  Shield,
  User,
  RefreshCw,
  Grid3X3,
  BarChart3,
  MessageSquare,
  Building2,
  Monitor,
  Mail,
} from "lucide-react";

interface User {
  uuid: string;
  emp_name: string | null;
  gender: string | null;
  date_of_birth: string | null;
  cnic: string | null;
  phone_no: string | null;
  designation: string | null;
  department: string | null;
  joining_date: string | null;
  email_id: string | null;
  username: string;
  password_hash?: string;
  role: "admin" | "user";
  is_active: boolean;
  created_on: string | null;
  updated_on: string | null;
}

export function UserManagement() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [total, setTotal] = useState(0);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/users?search=${encodeURIComponent(search)}&limit=100`,
      );

      if (response.ok) {
        const data = await response.json();
        setUsers(data.data);
        setTotal(data.total);
      } else {
        const data = await response.json();
        console.error("Failed to fetch users:", data.error);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [search]);

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleDeleteUser = async (uuid: string) => {
    if (!confirm("Are you sure you want to delete this user?")) {
      return;
    }

    try {
      const response = await authDelete(`/api/users/${uuid}`);

      if (response.ok) {
        loadUsers(); // Refresh the list
      } else {
        try {
          const data = await response.json();
          alert("Failed to delete user: " + data.error);
        } catch {
          alert("Failed to delete user");
        }
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Failed to delete user");
    }
  };

  const handleUserAdded = () => {
    setShowAddModal(false);
    loadUsers();
  };

  const handleUserUpdated = () => {
    setShowEditModal(false);
    setSelectedUser(null);
    loadUsers();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Navigation Tabs */}
      <div
        className="bg-white border-b border-gray-200"
        style={{ display: "flex", flexDirection: "column" }}
      >
        <div
          className="flex items-center justify-between h-16 px-6"
          style={{ margin: "0 auto" }}
        >
          <div className="flex items-center space-x-1">
            <button
              onClick={() => navigate("/")}
              className="flex flex-col items-center p-3 text-gray-500 hover:bg-gray-100 rounded-md"
            >
              <Grid3X3 className="w-5 h-5 mb-1" />
              <span className="text-xs">Home</span>
            </button>
            <button
              onClick={() => navigate("/?tab=device-status")}
              className="flex flex-col items-center p-3 text-gray-500 hover:bg-gray-100 rounded-md"
            >
              <BarChart3 className="w-5 h-5 mb-1" />
              <span className="text-xs">Device Status</span>
            </button>
            <button className="flex flex-col items-center p-3 text-gray-500 hover:bg-gray-100 rounded-md">
              <MessageSquare className="w-5 h-5 mb-1" />
              <span className="text-xs">Live Conversation</span>
            </button>
            <button
              onClick={() => navigate("/branch-management")}
              className="flex flex-col items-center p-3 text-gray-500 hover:bg-gray-100 rounded-md"
            >
              <Building2 className="w-5 h-5 mb-1" />
              <span className="text-xs">Branches</span>
            </button>
            <button
              onClick={() => navigate("/device-management")}
              className="flex flex-col items-center p-3 text-gray-500 hover:bg-gray-100 rounded-md"
            >
              <Monitor className="w-5 h-5 mb-1" />
              <span className="text-xs">Devices</span>
            </button>
            <button
              onClick={() => navigate("/?tab=analytics")}
              className="flex flex-col items-center p-3 text-gray-500 hover:bg-gray-100 rounded-md"
            >
              <BarChart3 className="w-5 h-5 mb-1" />
              <span className="text-xs">Analytics</span>
            </button>
            <button className="flex flex-col items-center p-3 rounded-md text-gray-700 bg-white border border-gray-300">
              <Users className="w-5 h-5 mb-1" />
              <span className="text-xs">User Management</span>
            </button>
            <button className="flex flex-col items-center p-3 text-gray-500 hover:bg-gray-100 rounded-md">
              <Mail className="w-5 h-5 mb-1" />
              <span className="text-xs">Complaints</span>
            </button>
          </div>
          <div className="flex items-center space-x-4" />
        </div>
      </div>

      <div
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
        style={{ padding: "24px 24px 5px" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              User Management
            </h1>
            <p className="text-gray-600">
              Manage system users and their permissions
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add User</span>
          </button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search users by name, username, CNIC, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <Shield className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Administrators
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {users.filter((u) => u.role === "admin").length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <User className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Regular Users
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {users.filter((u) => u.role === "user").length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Users</h3>
            <button
              onClick={loadUsers}
              className="flex items-center space-x-2 px-3 py-1 text-sm text-gray-600 hover:text-gray-900"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-500">Loading users...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact Info
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.uuid} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                            {user.role === "admin" ? (
                              <Shield className="h-4 w-4 text-blue-600" />
                            ) : (
                              <User className="h-4 w-4 text-blue-600" />
                            )}
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {user.emp_name || "N/A"}
                            </div>
                            <div className="text-sm text-gray-500">
                              @{user.username}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {user.email_id}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.phone_no}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {user.department || "N/A"}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.designation || "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.role === "admin"
                              ? "bg-red-100 text-red-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {user.role === "admin" ? (
                            <>
                              <Shield className="h-3 w-3 mr-1" />
                              Administrator
                            </>
                          ) : (
                            <>
                              <User className="h-3 w-3 mr-1" />
                              User
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.is_active
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {user.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEditUser(user)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.uuid)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {users.length === 0 && !loading && (
                <div className="text-center py-12">
                  <Users className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    No users found
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {search
                      ? "Try adjusting your search criteria."
                      : "Get started by creating a new user."}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <AddUserModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onUserAdded={handleUserAdded}
      />

      <EditUserModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onUserUpdated={handleUserUpdated}
        user={selectedUser}
      />
    </div>
  );
}
