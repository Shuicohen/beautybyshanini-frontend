import AnimatedBackground from '../components/AnimatedBackground';
import Hero from '../components/Hero';
import Services from '../components/Services';
import Gallery from '../components/Gallery';
import HoursContact from '../components/HoursContact';

const Home = () => {
  return (
    <div className="relative overflow-x-hidden">
      <AnimatedBackground />
      {/* Background subtle pattern - reduced opacity to show animated background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,transparent_20%,rgba(255,179,198,0.05)_100%)] pointer-events-none z-0"></div>
      
      <div>
        <Hero />
      </div>
      
      <div className="relative z-10">
        <Services />
      </div>
      
      <div className="relative z-10">
        <Gallery />
      </div>
      
      <div className="relative z-10">
        <HoursContact />
      </div>
    </div>
  );
};

export default Home;