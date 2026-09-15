import { useRef } from 'react';
import Box from '@mui/material/Box';

// Components
import Navbar from '../components/sections/NavBar';
import HeroSection from '../components/sections/HeroSection';
import ValueStripSection from '../components/sections/ValueStripSection';
import FeatureSpotlight from '../components/sections/FeatureSpotlight';
import CtaBanner from '../components/sections/CtaBanner';
import Footer from '../components/sections/Footer';

// Data
import { features} from '../data/landingContent'

export default function AuthPage() {
  const authRef = useRef<HTMLDivElement>(null);

  const scrollToAuth = () => {
    authRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <Box sx={{ overflowX: 'hidden' }}>
      <Navbar onSignIn={scrollToAuth} />

      <HeroSection authRef={authRef} />

      <ValueStripSection />

      {features.map((feature, index) => (
        <FeatureSpotlight 
          key={feature.headline} 
          {...feature} 
          reverse={index % 2 !== 0}
          shaded={index % 2 !== 0}
        />
      ))}

      <CtaBanner onJoin={scrollToAuth} />

      <Footer />
    </Box>
  );
}