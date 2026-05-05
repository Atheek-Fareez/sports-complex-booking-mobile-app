import React, { useState, useRef, useEffect } from 'react';
import chatService from '../services/chatService';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Modal,
} from 'react-native';

const ChatUI = ({ userToken }) => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      content: 'Hello! I\'m AAS, your assistant for the sports complex 😊 How can I help you today?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const scrollViewRef = useRef(null);
  const slideAnim = useRef(new Animated.Value(400)).current;

  // Animate chat widget in/out
  useEffect(() => {
    const toValue = isChatOpen ? 0 : 400;
    Animated.timing(slideAnim, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isChatOpen, slideAnim]);

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    if (scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (input.trim() === '' || loading) return;

    const userMessage = input.trim();
    setInput('');
    setError(null);

    // Add user message to chat
    const newUserMessage = {
      id: messages.length + 1,
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, newUserMessage]);
    setLoading(true);

    try {
      // Build conversation history (last 10 messages)
      const conversationHistory = messages
        .filter(m => m.role !== 'assistant' || m.content.length > 50) // Filter out system messages
        .slice(-10)
        .map(m => ({
          role: m.role === 'user' ? 'user' : 'assistant',
          content: m.content,
        }));

      // Call backend chat service
      const result = await chatService.sendMessage(userMessage, conversationHistory);

      if (!result.success) {
        throw new Error(result.error);
      }

      const data = result.data;

      // Add AI response to chat
      const aiMessage = {
        id: messages.length + 2,
        role: 'assistant',
        content: data.response || data.fallback || 'Sorry, I could not process that.',
        timestamp: new Date(),
        metadata: {
          success: data.success,
          intent: data.intent,
          timeRange: data.timeRange,
        },
      };

      setMessages(prev => [...prev, aiMessage]);
      setLoading(false);
    } catch (err) {
      console.error('[CHAT ERROR]', err);
      setError(err.message);

      const errorMessage = {
        id: messages.length + 2,
        role: 'assistant',
        content: `❌ Error: ${err.message}\n\nTip: Make sure the backend server is running and you're connected to the network.`,
        timestamp: new Date(),
        isError: true,
      };

      setMessages(prev => [...prev, errorMessage]);
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 1,
        role: 'assistant',
        content: '👋 Chat cleared! Ask me anything about your facility.',
        timestamp: new Date(),
      },
    ]);
    setError(null);
  };

  return (
    <>
      {/* Floating Chat Button */}
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => setIsChatOpen(!isChatOpen)}
        activeOpacity={0.8}
      >
        <Text style={styles.floatingButtonText}>
          {isChatOpen ? '✕' : '💬'}
        </Text>
      </TouchableOpacity>

      {/* Chat Widget Modal */}
      <Modal
        visible={isChatOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsChatOpen(false)}
      >
        <TouchableOpacity
          style={styles.backdrop}
          onPress={() => setIsChatOpen(false)}
          activeOpacity={1}
        />

        <Animated.View
          style={[
            styles.chatContainer,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Chat Header */}
          <View style={styles.chatHeader}>
            <Text style={styles.chatTitle}>Admin Assistant</Text>
            <View style={styles.headerActions}>
              <TouchableOpacity
                onPress={handleClearChat}
                style={styles.clearButton}
              >
                <Text style={styles.clearButtonText}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setIsChatOpen(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Messages Area */}
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end' }}
            showsVerticalScrollIndicator={false}
          >
            {messages.map(message => (
              <View
                key={message.id}
                style={[
                  styles.messageWrapper,
                  message.role === 'user'
                    ? styles.userMessageWrapper
                    : styles.assistantMessageWrapper,
                ]}
              >
                <View
                  style={[
                    styles.messageBubble,
                    message.role === 'user'
                      ? styles.userBubble
                      : styles.assistantBubble,
                    message.isError && styles.errorBubble,
                  ]}
                >
                  <Text
                    style={[
                      styles.messageText,
                      message.role === 'user'
                        ? styles.userMessageText
                        : styles.assistantMessageText,
                    ]}
                  >
                    {message.content}
                  </Text>
                  <Text style={styles.messageTime}>
                    {message.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
              </View>
            ))}

            {loading && (
              <View style={styles.loadingWrapper}>
                <ActivityIndicator size="small" color="#febb02" />
                <Text style={styles.loadingText}>Thinking...</Text>
              </View>
            )}
          </ScrollView>

          {/* Input Area */}
          <View style={styles.inputContainer}>
            {error && (
              <Text style={styles.errorText}>⚠️ {error}</Text>
            )}
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                placeholder="Ask about bookings, income, tickets..."
                placeholderTextColor="#999"
                value={input}
                onChangeText={setInput}
                editable={!loading}
                multiline={true}
                maxLength={500}
              />
              <TouchableOpacity
                style={[styles.sendButton, loading && styles.sendButtonDisabled]}
                onPress={handleSendMessage}
                disabled={loading || input.trim() === ''}
              >
                <Text style={styles.sendButtonText}>
                  {loading ? '⏳' : '➤'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#febb02',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
    zIndex: 999,
  },
  floatingButtonText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 998,
  },
  chatContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '85%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 10,
  },
  chatHeader: {
    backgroundColor: '#003580',
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  clearButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  closeButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 16,
    backgroundColor: '#f5f5f5',
  },
  messageWrapper: {
    marginBottom: 12,
    flexDirection: 'row',
  },
  userMessageWrapper: {
    justifyContent: 'flex-end',
  },
  assistantMessageWrapper: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  userBubble: {
    backgroundColor: '#003580',
    borderBottomRightRadius: 2,
  },
  assistantBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 2,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  errorBubble: {
    backgroundColor: '#ffe5e5',
    borderColor: '#ff6b6b',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  userMessageText: {
    color: '#fff',
  },
  assistantMessageText: {
    color: '#333',
  },
  messageTime: {
    fontSize: 11,
    opacity: 0.6,
    marginTop: 4,
  },
  loadingWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 12,
  },
  loadingText: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
  },
  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 12,
    paddingBottom: 16,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 12,
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    maxHeight: 100,
    backgroundColor: '#f9f9f9',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#febb02',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
});

export default ChatUI;
