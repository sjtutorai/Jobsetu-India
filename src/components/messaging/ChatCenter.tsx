import React, { useState, useEffect, useRef } from 'react';
import { useJobs } from '../../context/JobContext';
import { useAuth } from '../../context/AuthContext';
import { Conversation, Message, UserRole } from '../../types';
import {
  MessageSquare,
  Send,
  User,
  Clock,
  Search,
  Check,
  CheckCheck,
  AlertTriangle,
  ArrowLeft
} from 'lucide-react';

interface ChatCenterProps {
  initialConversationId?: string;
}

export const ChatCenter: React.FC<ChatCenterProps> = ({ initialConversationId }) => {
  const {
    conversations,
    activeConversation,
    activeMessages,
    openConversation,
    sendMessage,
    toggleBlockConversation,
    reportItem
  } = useJobs();
  const { currentUser } = useAuth();

  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-select initial conversation if provided or first in list
  useEffect(() => {
    if (initialConversationId) {
      const match = conversations.find((c) => c.id === initialConversationId);
      if (match) openConversation(match);
    } else if (!activeConversation && conversations.length > 0) {
      openConversation(conversations[0]);
    }
  }, [initialConversationId, conversations, activeConversation, openConversation]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages]);

  const getRecipientInfo = (conv: Conversation) => {
    if (!currentUser) return { name: 'User', photo: '', role: 'worker' as UserRole };
    const otherId = conv.participants.find((p) => p !== currentUser.uid) || '';
    const details = conv.participantDetails?.[otherId];
    return {
      name: details?.name || 'Recruiter / Candidate',
      photo: details?.photo || '',
      role: details?.role || 'worker'
    };
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !activeConversation || !currentUser || sending) return;

    const receiverId = activeConversation.participants.find((p) => p !== currentUser.uid) || '';
    try {
      setSending(true);
      await sendMessage(activeConversation.id, receiverId, inputText.trim());
      setInputText('');
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  const filteredConversations = conversations.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const other = getRecipientInfo(c);
    return other.name.toLowerCase().includes(q) || (c.lastMessage && c.lastMessage.toLowerCase().includes(q));
  });

  const activeRecipient = activeConversation ? getRecipientInfo(activeConversation) : null;

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden h-[750px] flex flex-col md:flex-row">
      {/* Left Column: Conversation List */}
      <div
        className={`w-full md:w-80 lg:w-96 border-r border-gray-200 flex flex-col bg-slate-50/50 ${
          activeConversation ? 'hidden md:flex' : 'flex'
        }`}
      >
        <div className="p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-[#2563EB]" />
              <span>In-App Messages</span>
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-[#2563EB]">
              {conversations.length}
            </span>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 bg-slate-50 outline-none focus:bg-white focus:border-[#2563EB]"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center">
              <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-xs text-gray-500 font-medium">No conversations yet.</p>
              <p className="text-[11px] text-gray-400 mt-1">
                When you contact employers or applicants, threads appear here.
              </p>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const recipient = getRecipientInfo(conv);
              const isSelected = activeConversation?.id === conv.id;
              const hasUnread = currentUser && conv.unreadBy?.includes(currentUser.uid);

              return (
                <button
                  key={conv.id}
                  type="button"
                  onClick={() => openConversation(conv)}
                  className={`w-full text-left p-4 transition-colors flex items-start gap-3 cursor-pointer ${
                    isSelected ? 'bg-blue-50/80 border-l-4 border-[#2563EB]' : 'hover:bg-gray-100/70 bg-white'
                  }`}
                >
                  <div className="relative shrink-0">
                    {recipient.photo ? (
                      <img
                        src={recipient.photo}
                        alt={recipient.name}
                        className="w-11 h-11 rounded-2xl object-cover border border-gray-200"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-2xl bg-blue-100 text-[#2563EB] font-bold text-sm flex items-center justify-center">
                        {recipient.name.charAt(0)}
                      </div>
                    )}
                    {hasUnread && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#2563EB] rounded-full border-2 border-white" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="text-xs font-bold text-gray-900 truncate">{recipient.name}</h4>
                      {conv.lastMessageAt && (
                        <span className="text-[10px] text-gray-400 shrink-0">
                          {new Date(
                            conv.lastMessageAt?.seconds
                              ? conv.lastMessageAt.seconds * 1000
                              : conv.lastMessageAt
                          ).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-gray-500 truncate mt-1">
                      {conv.lastMessage || 'Conversation opened'}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Right Column: Active Conversation Messages */}
      {activeConversation && activeRecipient ? (
        <div
          className={`flex-1 flex flex-col bg-white ${
            !activeConversation ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Thread Header */}
          <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-slate-50/70">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {}}
                className="md:hidden p-1.5 rounded-lg text-gray-600 hover:bg-gray-200"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>

              {activeRecipient.photo ? (
                <img
                  src={activeRecipient.photo}
                  alt={activeRecipient.name}
                  className="w-10 h-10 rounded-2xl object-cover border border-gray-200"
                />
              ) : (
                <div className="w-10 h-10 rounded-2xl bg-blue-100 text-[#2563EB] font-bold text-sm flex items-center justify-center">
                  {activeRecipient.name.charAt(0)}
                </div>
              )}

              <div>
                <h3 className="text-sm font-bold text-gray-900">{activeRecipient.name}</h3>
                <p className="text-[11px] text-gray-500 flex items-center gap-2">
                  <span className="font-semibold text-emerald-600">Active on JOBSETU</span>
                  <span>• {activeRecipient.role === 'employer' ? 'Verified Employer' : 'Candidate'}</span>
                  {activeConversation?.isBlocked && (
                    <span className="text-red-600 font-bold">• Blocked</span>
                  )}
                </p>
              </div>
            </div>

            {/* Actions: Block and Report */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const targetUser = activeConversation.participants.find(p => p !== currentUser?.uid);
                  if (targetUser) {
                    const reason = window.prompt('Please enter the reason for reporting this contact:');
                    if (reason && reason.trim()) {
                      reportItem('conversation', activeConversation.id, reason.trim());
                      window.alert('Report received. JOBSETU Trust & Safety team will review the conversation history.');
                    }
                  }
                }}
                className="px-2.5 py-1 rounded-xl text-[11px] font-bold text-gray-500 hover:text-red-600 hover:bg-red-50 border border-gray-200 transition-colors cursor-pointer"
                title="Report user"
              >
                Report
              </button>

              <button
                type="button"
                onClick={() => {
                  const isCurrentlyBlocked = activeConversation?.isBlocked;
                  const confirmed = window.confirm(
                    isCurrentlyBlocked
                      ? 'Unblock this contact to resume messaging?'
                      : 'Block this contact? They will no longer be able to message you.'
                  );
                  if (confirmed) {
                    toggleBlockConversation(activeConversation.id, !isCurrentlyBlocked);
                  }
                }}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-colors cursor-pointer border ${
                  activeConversation?.isBlocked
                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100 border-gray-200'
                }`}
              >
                {activeConversation?.isBlocked ? 'Unblock' : 'Block'}
              </button>
            </div>
          </div>

          {/* Messages Thread Container */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-3 bg-[#F9FAFB]/60">
            {activeMessages.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs">No messages yet. Send a message to initiate communication.</p>
              </div>
            ) : (
              activeMessages.map((msg: Message) => {
                const isMe = msg.senderId === currentUser?.uid;

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[78%] sm:max-w-md px-4 py-2.5 rounded-2xl text-xs font-medium leading-relaxed shadow-2xs ${
                        isMe
                          ? 'bg-[#2563EB] text-white rounded-tr-xs'
                          : 'bg-white text-gray-800 border border-gray-200 rounded-tl-xs'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    </div>

                    <div className="flex items-center gap-1 mt-1 text-[10px] text-gray-400 px-1">
                      <span>
                        {new Date(
                          msg.createdAt?.seconds ? msg.createdAt.seconds * 1000 : msg.createdAt
                        ).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {isMe && (
                        <span>
                          {msg.read ? (
                            <CheckCheck className="w-3 h-3 text-blue-600 inline" />
                          ) : (
                            <Check className="w-3 h-3 text-gray-400 inline" />
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <form
            onSubmit={handleSend}
            className="p-3 sm:p-4 border-t border-gray-200 bg-white flex items-center gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-xs outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || sending}
              className="px-4 py-2.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </form>
        </div>
      ) : (
        <div className="flex-1 hidden md:flex items-center justify-center p-8 text-center text-gray-400">
          <div>
            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <h3 className="text-sm font-bold text-gray-700">Select a Conversation</h3>
            <p className="text-xs text-gray-500 max-w-xs mx-auto mt-1">
              Choose an applicant or employer from the list on the left to review communication history.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
