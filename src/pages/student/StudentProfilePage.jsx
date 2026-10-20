/**
 * @fileoverview Dedicated Student Profile Page - KRC Institute of Technology
 * Integrates the Nordic Editorial Profile UI (#3) into the Student Portal routes.
 * Accessible directly at /student/profile with full navigation and resilience.
 * @copyright Copyright (c) 2026 Chinmay Chaudhari. All Rights Reserved.
 * @license MIT License
 */

import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import DedicatedProfileView from '../../components/chat/views/DedicatedProfileView';
import ErrorBoundary from '../../components/common/ErrorBoundary';
import { useChatSelection } from '../../hooks/useChatSelection.js';

export default function StudentProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { beginChatAction, cancelChatAction } = useChatSelection();

  return (
    <ErrorBoundary 
      title="Student Profile"
      message="Unable to render profile at this moment. You can safely return to your overview dashboard."
      onRecovery={() => navigate('/student/dashboard')}
    >
      <div className="h-[calc(100vh-4rem)] w-full flex flex-col rounded-2xl overflow-hidden border border-border shadow-sm">
        <DedicatedProfileView
          currentStudent={user}
          targetStudent={user}
          onBack={() => { cancelChatAction(); navigate('/student/chat'); }}
          onStartChat={chat => navigate('/student/chat', { state: { initialChat: chat } })}
          beginChatAction={beginChatAction}
        />
      </div>
    </ErrorBoundary>
  );
}
