import React from 'react';
import { ArrowRight, Zap, Users, Clock, Shield, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';

export default function LandingPage() {
  const navigate = useNavigate();

  const features = [
    {
      icon: Zap,
      title: 'Lightning Fast Onboarding',
      description: 'Get users activated in minutes, not days. Our AI-powered system eliminates friction at every step.'
    },
    {
      icon: Users,
      title: 'Intelligent User Guidance',
      description: 'Smart virtual assistants guide users through complex processes with personalized, contextual help.'
    },
    {
      icon: Clock,
      title: 'Real-time Analytics',
      description: 'Track user progress, identify bottlenecks, and optimize your onboarding flow with live insights.'
    },
    {
      icon: Shield,
      title: 'Enterprise Security',
      description: 'Bank-grade security with SOC 2 compliance, ensuring your user data is always protected.'
    }
  ];

  const stats = [
    { value: '85%', label: 'Faster Onboarding' },
    { value: '10M+', label: 'Users Onboarded' },
    { value: '99.9%', label: 'Uptime SLA' },
    { value: '24/7', label: 'Support Available' }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-gray-100 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand to-accent text-white">
                <Zap className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-brand to-accent bg-clip-text text-transparent">
                FASTSOL
              </span>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-brand transition-colors">Features</a>
              <a href="#pricing" className="text-gray-600 hover:text-brand transition-colors">Pricing</a>
              <a href="#contact" className="text-gray-600 hover:text-brand transition-colors">Contact</a>
            </div>

            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/auth?mode=login')}
              >
                Login
              </Button>
              <Button 
                onClick={() => navigate('/auth?mode=signup')}
                className="bg-gradient-to-r from-brand to-accent hover:from-brand-600 hover:to-accent-600"
              >
                Sign Up
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-brand/10 to-accent/10 rounded-full text-sm font-medium text-brand mb-8">
              <Zap className="h-4 w-4" />
              Onboard users faster than the speed of light
            </div>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6">
              Transform Your
              <span className="block bg-gradient-to-r from-brand to-accent bg-clip-text text-transparent">
                User Onboarding
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              FASTSOL's AI-powered platform eliminates onboarding friction, guiding users to activation 
              with intelligent virtual assistants that understand context and provide personalized help.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button 
                size="lg"
                onClick={() => navigate('/auth?mode=signup')}
                className="bg-gradient-to-r from-brand to-accent hover:from-brand-600 hover:to-accent-600 text-lg px-8 py-4"
                icon={ArrowRight}
              >
                Start Free Trial
              </Button>
              <Button 
                size="lg"
                variant="outline"
                className="text-lg px-8 py-4"
              >
                Watch Demo
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-brand to-accent bg-clip-text text-transparent">
                    {stat.value}
                  </div>
                  <div className="text-gray-600 text-sm mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose FASTSOL?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our platform combines cutting-edge AI with intuitive design to create 
              onboarding experiences that users actually love.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-lg transition-shadow">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand/10 to-accent/10 mb-6">
                  <feature.icon className="h-6 w-6 text-brand" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-brand to-accent">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Transform Your Onboarding?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Join thousands of companies using FASTSOL to onboard users faster than ever before.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              onClick={() => navigate('/auth?mode=signup')}
              className="bg-white text-brand hover:bg-gray-50 text-lg px-8 py-4"
              icon={ArrowRight}
            >
              Start Your Free Trial
            </Button>
            <Button 
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white/10 text-lg px-8 py-4"
            >
              Schedule Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand to-accent">
                  <Zap className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold">FASTSOL</span>
              </div>
              <p className="text-gray-400">
                Onboard users faster than the speed of light with AI-powered virtual assistants.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Community</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Status</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 FASTSOL. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}