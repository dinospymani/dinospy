import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(' [SYSTEM_CRASH] Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-xl w-full bg-white rounded-[3rem] border border-black/5 p-12 text-center shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)]"
          >
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-10">
              <AlertTriangle size={40} strokeWidth={1} />
            </div>
            
            <h1 className="text-4xl font-display italic tracking-tighter mb-6">Vault Breach Detected</h1>
            <p className="text-neutral-400 text-lg font-light leading-relaxed mb-10 italic">
              A critical synchronization error has occurred. The archival interface has been suspended to protect data integrity.
            </p>

            <div className="bg-neutral-50 rounded-2xl p-6 mb-10 text-left overflow-hidden">
               <p className="font-tech text-[8px] tracking-[0.3em] uppercase text-black/20 mb-4">Error_Metadata</p>
               <p className="font-mono text-[10px] text-red-500 break-all leading-relaxed">
                 {this.state.error?.message || 'Unknown protocol failure'}
               </p>
            </div>

            <div className="flex flex-col space-y-4">
              <button 
                onClick={this.handleReset}
                className="w-full bg-black text-white py-6 rounded-2xl font-tech text-[10px] tracking-[0.4em] uppercase font-black hover:bg-neutral-800 transition-all flex items-center justify-center space-x-4"
              >
                <RefreshCw size={14} />
                <span>Re-Initialize System</span>
              </button>
              
              <button 
                onClick={() => window.location.reload()}
                className="w-full py-6 text-black/40 hover:text-black transition-colors font-tech text-[10px] tracking-[0.4em] uppercase font-black"
              >
                Force Hard Reload
              </button>
            </div>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}
