import React from "react";
import { ConversationAnalytics as ConversationAnalyticsComponent } from "../components/ConversationAnalytics";

export function ConversationAnalytics() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ConversationAnalyticsComponent />
      </div>
    </div>
  );
}
