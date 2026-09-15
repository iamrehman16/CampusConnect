import { useState } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import { useTheme } from '@mui/material/styles';
import LoginForm from '../components/LoginForm';
import RegisterForm from '../components/RegisterForm';

interface AuthCardProps {
  defaultTab?: number;
}

export default function AuthCard({ defaultTab = 0 }: AuthCardProps) {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(defaultTab);

  const handleRegisterSuccess = () => setActiveTab(0);

  return (
    <Card
      sx={{
        width: '100%',
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 3,
        boxShadow: theme.shadows[8],
      }}
    >
      <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
        <Typography variant="h6" fontWeight={700} mb={0.5}>
          {activeTab === 0 ? 'Welcome back' : 'Join CampusConnect'}
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          {activeTab === 0
            ? 'Sign in to continue your academic journey'
            : 'Connect, learn and grow with your campus'}
        </Typography>
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          variant="fullWidth"
          indicatorColor="primary"
          textColor="primary"
          sx={{ mb: 3 }}
        >
          <Tab label="Sign In" />
          <Tab label="Sign Up" />
        </Tabs>
        {activeTab === 0 && <LoginForm />}
        {activeTab === 1 && <RegisterForm onSuccess={handleRegisterSuccess} />}
      </CardContent>
    </Card>
  );
}