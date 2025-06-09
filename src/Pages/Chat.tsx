import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  AppBar,
  Toolbar,
  IconButton,
  TextField,
  Paper,
  Avatar,
  Button,
  useTheme,
  useMediaQuery,
  styled,
  keyframes,
  Snackbar,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';

// import Grid from '@mui/material/Grid';
import { GridLegacy as Grid } from '@mui/material';



import {
  Send,
  Add,
  ChatBubbleOutline,
  PersonOutline,
  SmartToyOutlined,
  DeleteOutline,
  Menu,
  ChevronLeft,
  LogoutOutlined,
} from '@mui/icons-material';

// Import API service and types
import { apiService } from '../services/apiService';
import type { User, MessageData as APIMessageData } from '../types/api';

// --- Local Interfaces ---
interface MessageData {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface Chat {
  id: string;
  title: string;
  messages: MessageData[];
  lastMessage: Date;
  messageCount: number;
}

// --- Keyframes for Typing Indicator ---
const bounce = keyframes`
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1.0); }
`;

const TypingIndicator = styled('div')({
  display: 'flex',
  '& div': {
    width: '8px',
    height: '8px',
    backgroundColor: '#9CA3AF',
    borderRadius: '50%',
    margin: '0 2px',
    animation: `${bounce} 1.4s infinite ease-in-out both`,
  },
  '& div:nth-of-type(1)': { animationDelay: '-0.32s' },
  '& div:nth-of-type(2)': { animationDelay: '-0.16s' },
});

// --- Main Chat Component ---
const ChatApp: React.FC = () => {
  const theme = useTheme();
  const isLargeScreen = useMediaQuery(theme.breakpoints.up('lg'));

  // --- State Management ---
  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<string>('');
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  // --- Refs ---
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- Effects ---
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [chats, activeChat]);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // --- API Integration Functions ---
  const loadInitialData = async () => {
    try {
      setLoading(true);

      // Check if user is authenticated
      if (!apiService.isAuthenticated()) {
        window.location.href = '/';
        return;
      }

      // Load user profile
      const userProfile = await apiService.getUserProfile();
      if (!userProfile?.data?.name || !userProfile?.data?.age || !userProfile?.data?.profession || !userProfile?.data?.address) {
        window.location.href = '/user-info';
        return;
      }
      setUser(userProfile.data);

      // Load chats
      await loadChats();
    } catch (error: any) {
      console.error('Error loading initial data:', error);
      setError(error.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadChats = async () => {
    try {
      const response = await apiService.getChats();
      const formattedChats: Chat[] = response.data.chats.map(chat => ({
        id: chat.id,
        title: chat.title,
        messages: [],
        lastMessage: new Date(chat.updatedAt),
        messageCount: chat.messageCount,
      }));

      setChats(formattedChats);

      // Set active chat to first chat if none selected
      if (!activeChat && formattedChats.length > 0) {
        setActiveChat(formattedChats[0].id);
        await loadMessages(formattedChats[0].id);
      }
    } catch (error: any) {
      console.error('Error loading chats:', error);
      setError(error.response?.data?.message || 'Failed to load chats');
    }
  };

  const loadMessages = async (chatId: string) => {
    try {
      const response = await apiService.getMessages({ chatId });
      console.log('Loaded messages for chat:', chatId, response.data);

      const formattedMessages: MessageData[] = response.data.messages.map((msg: APIMessageData) => ({
        id: msg.id,
        text: msg.content,
        isUser: msg.role === 'user',
        timestamp: new Date(msg.createdAt),
      }));

      setChats(prev => prev.map(chat =>
        chat.id === chatId
          ? { ...chat, messages: formattedMessages }
          : chat
      ));
    } catch (error: any) {
      console.error('Error loading messages:', error);
      setError(error.response?.data?.message || 'Failed to load messages');
    }
  };

  // --- Handlers ---
  const handleSidebarToggle = () => {
    if (isLargeScreen) {
      setSidebarCollapsed(!isSidebarCollapsed);
    } else {
      setMobileSidebarOpen(!isMobileSidebarOpen);
    }
  };

  const createNewChat = async () => {
    try {
      const response = await apiService.createChat({ title: 'New Chat' });
      const newChat: Chat = {
        id: response.data.id,
        title: response.data.title,
        messages: [],
        lastMessage: new Date(response.data.createdAt),
        messageCount: 0,
      };

      setChats(prev => [newChat, ...prev]);
      setActiveChat(newChat.id);
      if (!isLargeScreen) setMobileSidebarOpen(false);
    } catch (error: any) {
      console.error('Error creating chat:', error);
      setError(error.response?.data?.message || 'Failed to create chat');
    }
  };

  const confirmDeleteChat = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setChatToDelete(chatId);
    setDeleteDialogOpen(true);
  };

  const deleteChat = async () => {
    if (!chatToDelete) return;

    try {
      await apiService.deleteChat(chatToDelete);

      setChats(prev => prev.filter(chat => chat.id !== chatToDelete));

      if (activeChat === chatToDelete) {
        const remainingChats = chats.filter(chat => chat.id !== chatToDelete);
        if (remainingChats.length > 0) {
          setActiveChat(remainingChats[0].id);
          await loadMessages(remainingChats[0].id);
        } else {
          setActiveChat('');
        }
      }
    } catch (error: any) {
      console.error('Error deleting chat:', error);
      setError(error.response?.data?.message || 'Failed to delete chat');
    } finally {
      setDeleteDialogOpen(false);
      setChatToDelete(null);
    }
  };

  const sendMessage = async () => {
    if (!message.trim() || !activeChat) return;

    try {
      setIsTyping(true);

      const response = await apiService.sendMessage({
        chatId: activeChat,
        message: message.trim(),
      });

      console.log('Sent message:', response.data);

      const userMessage: MessageData = {
        id: response.data.userMessage.id,
        text: response.data.userMessage.content,
        isUser: true,
        timestamp: new Date(response.data.userMessage.createdAt),
      };

      const aiMessage: MessageData = {
        id: response.data.aiMessage.id,
        text: response.data.aiMessage.content,
        isUser: false,
        timestamp: new Date(response.data.aiMessage.createdAt),
      };

      setChats(prev => prev.map(chat =>
        chat.id === activeChat
          ? {
            ...chat,
            messages: [...chat.messages, userMessage, aiMessage],
            title: chat.messages.length === 0 ? message.slice(0, 30) + (message.length > 30 ? '...' : '') : chat.title,
            lastMessage: new Date(),
            messageCount: chat.messageCount + 2,
          }
          : chat
      ));

      setMessage('');
    } catch (error: any) {
      console.error('Error sending message:', error);
      setError(error.response?.data?.message || 'Failed to send message');
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleChatSelect = async (chatId: string) => {
    setActiveChat(chatId);
    if (!isLargeScreen) setMobileSidebarOpen(false);

    // Load messages if not already loaded
    const chat = chats.find(c => c.id === chatId);
    if (chat && chat.messages.length === 0 && chat.messageCount > 0) {
      await loadMessages(chatId);
    }
  };

  const handleLogout = async () => {
    try {
      await apiService.logout();
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      // Force redirect even if API call fails
      window.location.href = '/';
    }
  };

  const getCurrentChat = () => chats.find(chat => chat.id === activeChat);
  const currentMessages = getCurrentChat()?.messages || [];

  // --- Render Loading State ---
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress size={40} />
      </Box>
    );
  }

  // --- Sidebar & Drawer Configuration ---
  const drawerWidth = 280;
  const collapsedDrawerWidth = 80;

  const sidebarContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Toolbar sx={{ justifyContent: 'space-between', p: '16px !important' }}>
        {!isSidebarCollapsed && (
          <Typography variant="h5" fontWeight={600} color="grey.800">
            DiagnoseAI
          </Typography>
        )}
        <IconButton onClick={handleSidebarToggle} sx={{ display: { xs: 'none', lg: 'inline-flex' } }}>
          <ChevronLeft sx={{ transition: 'transform 0.3s', transform: isSidebarCollapsed ? 'rotate(180deg)' : 'rotate(0deg)' }} />
        </IconButton>
      </Toolbar>

      <Box sx={{ p: 2 }}>
        <Button
          onClick={createNewChat}
          variant="contained"
          fullWidth
          startIcon={<Add />}
          sx={{
            bgcolor: '#2563EB', '&:hover': { bgcolor: '#1D4ED8' },
            py: 1.5, borderRadius: '8px', textTransform: 'none', fontSize: '1rem',
            justifyContent: isSidebarCollapsed ? 'center' : 'flex-start'
          }}
        >
          {!isSidebarCollapsed && 'New Chat'}
        </Button>
      </Box>

      <List sx={{ flexGrow: 1, overflowY: 'auto', px: 2 }}>
        {chats.map((chat) => (
          <ListItem
            key={chat.id}
            disablePadding
            sx={{
              my: 0.5,
              '& .delete-icon': { opacity: 0 },
              '&:hover .delete-icon': { opacity: 1 },
            }}
          >
            <ListItemButton
              selected={activeChat === chat.id}
              onClick={() => handleChatSelect(chat.id)}
              sx={{
                borderRadius: '8px',
                '&.Mui-selected': { bgcolor: '#DBEAFE', '&:hover': { bgcolor: '#BFDBFE' } },
                '&.Mui-selected .MuiTypography-root, &.Mui-selected .MuiSvgIcon-root': { color: '#2563EB' },
                justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
                px: isSidebarCollapsed ? 2 : 2,
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}><ChatBubbleOutline /></ListItemIcon>
              {!isSidebarCollapsed && (
                <ListItemText
                  primary={chat.title}
                  secondary={`${chat.messageCount} messages`}
                  primaryTypographyProps={{ fontWeight: 500, noWrap: true }}
                  secondaryTypographyProps={{ fontSize: '0.75rem' }}
                />
              )}
            </ListItemButton>
            {!isSidebarCollapsed && (
              <IconButton
                size="medium"
                onClick={(e) => confirmDeleteChat(chat.id, e)}
                className="delete-icon"
                sx={{
                  position: 'absolute', right: 8,
                  '&:hover': { bgcolor: '#FEE2E2' },
                  color: '#EF4444',
                  transition: 'opacity 0.2s',
                  ml: 2,
                }}
              >
                <DeleteOutline fontSize="medium" />
              </IconButton>
            )}
          </ListItem>
        ))}
      </List>

      {/* User Profile Section */}
      {user && !isSidebarCollapsed && (
        <Box sx={{ p: 2, borderTop: '1px solid #E5E7EB' }}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={1}>
              <Avatar sx={{ width: 32, height: 32, bgcolor: '#2563EB' }}>
                {user.name.charAt(0)}
              </Avatar>
              <Box>
                <Typography variant="body2" fontWeight={500} noWrap>
                  {user.name}
                </Typography>
                <Typography variant="caption" color="grey.600" noWrap>
                  {user.email}
                </Typography>
              </Box>
            </Box>
            <IconButton onClick={handleLogout} size="small" color="error">
              <LogoutOutlined fontSize="medium" />
            </IconButton>
          </Box>
        </Box>
      )}
    </Box>
  );

  console.log(currentMessages);
  console.log("chats", chats);

  return (
    <Box sx={{ display: 'flex', height: '100vh', bgcolor: '#F9FAFB' }}>
      {/* --- Sidebar --- */}
      <Drawer
        variant={isLargeScreen ? "permanent" : "temporary"}
        open={isLargeScreen || isMobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
        sx={{
          width: isLargeScreen ? (isSidebarCollapsed ? collapsedDrawerWidth : drawerWidth) : drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: isLargeScreen ? (isSidebarCollapsed ? collapsedDrawerWidth : drawerWidth) : drawerWidth,
            boxSizing: 'border-box',
            borderRight: '1px solid #E5E7EB',
            bgcolor: 'white',
            transition: theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
            overflowX: 'hidden',
          },
        }}
      >
        {sidebarContent}
      </Drawer>

      {/* --- Main Content --- */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          transition: theme.transitions.create('margin', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        }}
      >
        {/* Mobile Header */}
        <AppBar position="static" sx={{ display: { lg: 'none' }, bgcolor: 'white', boxShadow: 'none', borderBottom: '1px solid #E5E7EB' }}>
          <Toolbar>
            <IconButton edge="start" color="default" onClick={() => setMobileSidebarOpen(true)} sx={{ mr: 1 }}>
              <Menu />
            </IconButton>
            <Typography variant="h6" color="grey.800">
              DiagnoseAI
            </Typography>
          </Toolbar>
        </AppBar>

        {/* Message Area */}
        <Box sx={{ flexGrow: 1, overflowY: 'auto', p: { xs: 2, md: 3 } }}>
          {currentMessages.length === 0 ? (
            <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100%" textAlign="center">
              <Avatar sx={{ width: 64, height: 64, bgcolor: '#DBEAFE', mb: 2 }}>
                <SmartToyOutlined sx={{ fontSize: 40, color: '#2563EB' }} />
              </Avatar>
              <Typography variant="h4" fontWeight={600} color="grey.800" mb={1}>
                Start a new conversation
              </Typography>
              <Typography color="grey.600">
                Ask me anything and I'll do my best to help!
              </Typography>
            </Box>
          ) : (
            <Grid container direction="column" spacing={2} sx={{ maxWidth: '4xl', mx: 'auto' }}>
              {currentMessages.map((msg) => (
                <Grid item key={msg.id} alignSelf={msg.isUser ? 'flex-end' : 'flex-start'}>
                  <Box display="flex" gap={1.5} flexDirection={msg.isUser ? 'row-reverse' : 'row'} alignItems="flex-start" maxWidth="80%">
                    <Avatar sx={{ bgcolor: msg.isUser ? '#2563EB' : '#E5E7EB', color: msg.isUser ? 'white' : '#4B5563' }}>
                      {msg.isUser ? <PersonOutline sx={{ fontSize: '1.2rem' }} /> : <SmartToyOutlined sx={{ fontSize: '1.2rem' }} />}
                    </Avatar>
                    <Paper
                      elevation={0}
                      sx={{
                        px: 2, py: 1.5,
                        borderRadius: '20px',
                        bgcolor: msg.isUser ? '#2563EB' : 'white',
                        color: msg.isUser ? 'white' : 'grey.800',
                        border: msg.isUser ? 'none' : '1px solid #E5E7EB',
                      }}
                    >
                      <Typography component="div" sx={{ lineHeight: 1.6 }}>
                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                      </Typography>

                      <Typography variant="caption" display="block" sx={{ mt: 1, textAlign: 'right', opacity: 0.7 }}>
                        {msg.timestamp.toLocaleTimeString()}
                      </Typography>
                    </Paper>
                  </Box>
                </Grid>
              ))}
              {isTyping && (
                <Grid item alignSelf="flex-start">
                  <Box display="flex" gap={1.5} alignItems="flex-start">
                    <Avatar sx={{ bgcolor: '#E5E7EB' }}><SmartToyOutlined sx={{ color: '#4B5563' }} /></Avatar>
                    <Paper elevation={0} sx={{ p: 2, borderRadius: '20px', border: '1px solid #E5E7EB' }}>
                      <TypingIndicator><div></div><div></div><div></div></TypingIndicator>
                    </Paper>
                  </Box>
                </Grid>
              )}
              <div ref={messagesEndRef} />
            </Grid>
          )}
        </Box>

        {/* Input Area */}
        <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: 'white', borderTop: '1px solid #E5E7EB' }}>
          <Box display="flex" alignItems="flex-end" gap={1.5} maxWidth="4xl" mx="auto">
            <TextField
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message here..."
              multiline maxRows={5} disabled={isTyping} fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                  '&.Mui-focused fieldset': { borderColor: '#2563EB' },
                },
              }}
            />
            <IconButton
              onClick={sendMessage}
              disabled={!message.trim() || isTyping}
              sx={{
                width: 52, height: 52,
                bgcolor: '#2563EB', color: 'white',
                borderRadius: '12px',
                '&:hover': { bgcolor: '#1D4ED8' },
                '&.Mui-disabled': { bgcolor: '#93C5FD' },
              }}
            >
              <Send />
            </IconButton>
          </Box>
        </Box>
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Chat</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this chat? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={deleteChat} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Error Snackbar */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ChatApp;
