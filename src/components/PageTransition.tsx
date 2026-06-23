import React from 'react';

export const PageTransition: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  React.useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div
      style={{
        animation: 'pageFadeIn 0.3s ease-out'
      }}
    >
      {children}
    </div>
  );
};
