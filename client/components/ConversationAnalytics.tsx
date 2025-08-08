import React from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  BarChart3,
} from "lucide-react";

export function ConversationAnalytics() {
  const { isAdmin } = useAuth();

  if (!isAdmin()) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Conversation Analytics
              </h2>
              <p className="text-gray-600">
                Comprehensive insights into recorded conversations
              </p>
            </div>
          </div>
        </div>

        {/* Empty State */}
        <div className="text-center py-12">
          <BarChart3 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Analytics Dashboard
          </h3>
          <p className="text-gray-500">
            Analytics charts have been removed from this screen.
          </p>
        </div>
      </div>
    </div>
  );
}
