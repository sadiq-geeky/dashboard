import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Header } from "../components/Header";
import { useNavigate } from "react-router-dom";
import {
  Monitor,
  Building2,
  Users,
  Link,
  Unlink,
  Plus,
  Trash2,
  Search,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Settings,
} from "lucide-react";
import { authFetch, authPost, authDelete } from "@/lib/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Device {
  id: string;
  device_name: string;
  device_mac?: string;
  ip_address?: string;
  device_type: "recorder" | "monitor" | "other";
  device_status: "active" | "inactive" | "maintenance";
}

interface Branch {
  id: string;
  branch_code: string;
  branch_name: string;
  branch_city?: string;
  branch_address?: string;
}

interface User {
  uuid: string;
  username: string;
  email: string;
  role: string;
  full_name?: string;
}

interface Deployment {
  uuid: string;
  device_id: string;
  branch_id: string;
  user_id: string;
  created_on: string;
  device?: Device;
  branch?: Branch;
  user?: User;
}

export function Deployment() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [devices, setDevices] = useState<Device[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [selectedUser, setSelectedUser] = useState<string>("");

  // Fetch all data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [devicesRes, branchesRes, usersRes, deploymentsRes] =
        await Promise.all([
          authFetch("/api/devices?limit=100"),
          authFetch("/api/branches?limit=100&active=true"),
          authFetch("/api/users?limit=100"),
          authFetch("/api/deployments"),
        ]);

      // Check if all responses are OK before parsing JSON
      if (
        !devicesRes.ok ||
        !branchesRes.ok ||
        !usersRes.ok ||
        !deploymentsRes.ok
      ) {
        throw new Error("One or more API requests failed");
      }

      const [devicesData, branchesData, usersData, deploymentsData] =
        await Promise.all([
          devicesRes.json(),
          branchesRes.json(),
          usersRes.json(),
          deploymentsRes.json(),
        ]);

      setDevices(devicesData.data || []);
      setBranches(branchesData.data || []);
      setUsers(usersData.data || []);
      setDeployments(deploymentsData.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateDeployment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedDevice || !selectedBranch || !selectedUser) {
      alert("Please select a device, branch, and user");
      return;
    }

    try {
      const response = await authPost("/api/deployments", {
        device_id: selectedDevice,
        branch_id: selectedBranch,
        user_id: selectedUser,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create deployment");
      }

      await fetchData();
      setShowLinkModal(false);
      setSelectedDevice("");
      setSelectedBranch("");
      setSelectedUser("");
    } catch (error) {
      console.error("Error creating deployment:", error);
      alert(error.message || "Failed to create deployment");
    }
  };

  const handleDeleteDeployment = async (uuid: string) => {
    if (!confirm("Are you sure you want to remove this deployment?")) return;

    try {
      const response = await authDelete(`/api/deployments/${uuid}`);

      if (!response.ok) {
        try {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to delete deployment");
        } catch {
          throw new Error("Failed to delete deployment");
        }
      }
      await fetchData();
    } catch (error) {
      console.error("Error deleting deployment:", error);
      alert(error.message || "Failed to delete deployment");
    }
  };

  const getDeployedDeviceIds = () =>
    new Set(deployments.map((d) => d.device_id));
  const getDeployedBranchIds = () =>
    new Set(deployments.map((d) => d.branch_id));
  const getDeployedUserIds = () => new Set(deployments.map((d) => d.user_id));

  const availableDevices = devices.filter(
    (d) => !getDeployedDeviceIds().has(d.id),
  );
  const availableBranches = branches.filter(
    (b) => !getDeployedBranchIds().has(b.id),
  );
  const availableUsers = users.filter(
    (u) => u.role !== "admin" && !getDeployedUserIds().has(u.uuid),
  );

  if (!isAdmin()) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-600">
            Access denied. Admin privileges required.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Navigation */}

      <div className="px-6 py-6 pt-1" style={{ padding: "24px 24px 5px" }}>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Device Deployment
              </h1>
              <p className="text-gray-600">
                Link devices, branches, and users together
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={fetchData}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Refresh</span>
              </button>
              <button
                onClick={() => setShowLinkModal(true)}
                className="flex items-center space-x-2 rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600 transition-colors"
              >
                <Link className="h-4 w-4" />
                <span>Create Deployment</span>
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="h-8 w-8 animate-spin text-red-500" />
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
              {/* Available Resources */}
              <div className="xl:col-span-3 space-y-6">
                {/* Current Deployments */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Active Deployments
                    </h2>
                    <span className="text-sm text-gray-500">
                      {deployments.length} deployments
                    </span>
                  </div>

                  {deployments.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Settings className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p>No deployments configured yet</p>
                      <p className="text-sm">
                        Create your first deployment to get started
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {deployments.map((deployment) => (
                        <div
                          key={deployment.uuid}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border"
                        >
                          <div className="flex items-center space-x-6">
                            {/* Device */}
                            <div className="flex items-center space-x-2">
                              <div className="p-2 bg-blue-100 rounded-lg">
                                <Monitor className="h-5 w-5 text-blue-600" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">
                                  {devices.find(
                                    (d) => d.id === deployment.device_id,
                                  )?.device_name || "Unknown Device"}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {devices.find(
                                    (d) => d.id === deployment.device_id,
                                  )?.device_mac || "No MAC"}
                                </p>
                              </div>
                            </div>

                            <ArrowRight className="h-4 w-4 text-gray-400" />

                            {/* Branch */}
                            <div className="flex items-center space-x-2">
                              <div className="p-2 bg-green-100 rounded-lg">
                                <Building2 className="h-5 w-5 text-green-600" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">
                                  {branches.find(
                                    (b) => b.id === deployment.branch_id,
                                  )?.branch_name || "Unknown Branch"}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {branches.find(
                                    (b) => b.id === deployment.branch_id,
                                  )?.branch_code || "No Code"}
                                </p>
                              </div>
                            </div>

                            <ArrowRight className="h-4 w-4 text-gray-400" />

                            {/* User */}
                            <div className="flex items-center space-x-2">
                              <div className="p-2 bg-purple-100 rounded-lg">
                                <Users className="h-5 w-5 text-purple-600" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">
                                  {users.find(
                                    (u) => u.uuid === deployment.user_id,
                                  )?.full_name ||
                                    users.find(
                                      (u) => u.uuid === deployment.user_id,
                                    )?.username ||
                                    "Unknown User"}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {users.find(
                                    (u) => u.uuid === deployment.user_id,
                                  )?.role || "No Role"}
                                </p>
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() =>
                              handleDeleteDeployment(deployment.uuid)
                            }
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Unlink className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Available Resources Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Available Devices */}
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-900">
                        Available Devices
                      </h3>
                      <span className="text-sm text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                        {availableDevices.length}
                      </span>
                    </div>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {availableDevices.map((device) => (
                        <div
                          key={device.id}
                          className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg"
                        >
                          <Monitor className="h-5 w-5 text-blue-600" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">
                              {device.device_name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {device.device_mac || "No MAC"}
                            </p>
                          </div>
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              device.device_status === "active"
                                ? "bg-green-100 text-green-700"
                                : device.device_status === "maintenance"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-red-100 text-red-700"
                            }`}
                          >
                            {device.device_status}
                          </span>
                        </div>
                      ))}
                      {availableDevices.length === 0 && (
                        <p className="text-gray-500 text-sm text-center py-4">
                          No devices found
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Available Branches */}
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-900">
                        Available Branches
                      </h3>
                      <span className="text-sm text-green-600 bg-green-100 px-2 py-1 rounded-full">
                        {availableBranches.length}
                      </span>
                    </div>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {availableBranches.map((branch) => (
                        <div
                          key={branch.id}
                          className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg"
                        >
                          <Building2 className="h-5 w-5 text-green-600" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">
                              {branch.branch_name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {branch.branch_code}
                            </p>
                          </div>
                        </div>
                      ))}
                      {availableBranches.length === 0 && (
                        <p className="text-gray-500 text-sm text-center py-4">
                          No branches found
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Available Users */}
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-900">
                        Available Users
                      </h3>
                      <span className="text-sm text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
                        {availableUsers.length}
                      </span>
                    </div>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {availableUsers.map((user) => (
                        <div
                          key={user.uuid}
                          className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg"
                        >
                          <Users className="h-5 w-5 text-purple-600" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">
                              {user.full_name || user.username}
                            </p>
                            <p className="text-xs text-gray-500 capitalize">
                              {user.role}
                            </p>
                          </div>
                        </div>
                      ))}
                      {availableUsers.length === 0 && (
                        <p className="text-gray-500 text-sm text-center py-4">
                          No non-admin users available
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Statistics Sidebar */}
              <div className="space-y-6">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">
                    Deployment Statistics
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Total Devices</span>
                      <span className="font-semibold text-blue-600">
                        {devices.length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Deployed</span>
                      <span className="font-semibold text-green-600">
                        {deployments.length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Available</span>
                      <span className="font-semibold text-gray-600">
                        {availableDevices.length}
                      </span>
                    </div>
                    <div className="pt-2 border-t">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Deployment Rate</span>
                        <span className="font-semibold text-red-600">
                          {devices.length > 0
                            ? Math.round(
                                (deployments.length / devices.length) * 100,
                              )
                            : 0}
                          %
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">
                    Quick Actions
                  </h3>
                  <div className="space-y-3">
                    <button
                      onClick={() => navigate("/device-management")}
                      className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <Monitor className="h-5 w-5 text-blue-600" />
                        <span className="text-sm font-medium">
                          Manage Devices
                        </span>
                      </div>
                    </button>
                    <button
                      onClick={() => navigate("/branch-management")}
                      className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <Building2 className="h-5 w-5 text-green-600" />
                        <span className="text-sm font-medium">
                          Manage Branches
                        </span>
                      </div>
                    </button>
                    <button
                      onClick={() => navigate("/user-management")}
                      className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <Users className="h-5 w-5 text-purple-600" />
                        <span className="text-sm font-medium">
                          Manage Users
                        </span>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Link Modal */}
          {showLinkModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg mx-auto">
                <div className="flex items-center space-x-2 mb-6">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <Link className="h-5 w-5 text-red-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Create New Deployment
                  </h2>
                </div>
                <form onSubmit={handleCreateDeployment} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Device *
                    </label>
                    <Select
                      value={selectedDevice}
                      onValueChange={setSelectedDevice}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Choose a device" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableDevices.map((device) => (
                          <SelectItem key={device.id} value={device.id}>
                            <div className="flex items-center space-x-2">
                              <Monitor className="h-4 w-4 text-blue-500" />
                              <span className="font-medium">
                                {device.device_name}
                              </span>
                              <span className="text-gray-500">
                                ({device.device_mac || "No MAC"})
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Branch *
                    </label>
                    <Select
                      value={selectedBranch}
                      onValueChange={setSelectedBranch}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Choose a branch" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableBranches.map((branch) => (
                          <SelectItem key={branch.id} value={branch.id}>
                            <div className="flex items-center space-x-2">
                              <Building2 className="h-4 w-4 text-green-500" />
                              <span className="font-medium">
                                {branch.branch_name}
                              </span>
                              <span className="text-gray-500">
                                ({branch.branch_code})
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select User *
                    </label>
                    <Select
                      value={selectedUser}
                      onValueChange={setSelectedUser}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Choose a user" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableUsers.map((user) => (
                          <SelectItem key={user.uuid} value={user.uuid}>
                            <div className="flex items-center space-x-2">
                              <Users className="h-4 w-4 text-purple-500" />
                              <span className="font-medium">
                                {user.full_name || user.username}
                              </span>
                              <span className="text-gray-500 capitalize">
                                ({user.role})
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => {
                        setShowLinkModal(false);
                        setSelectedDevice("");
                        setSelectedBranch("");
                        setSelectedUser("");
                      }}
                      className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium flex items-center space-x-2"
                    >
                      <Link className="h-4 w-4" />
                      <span>Create Deployment</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
