import React from 'react';

export default function StatCard({ title, value, icon: Icon, color, description, style: wrapperStyle }) {
  const getColorClasses = (color) => {
    switch (color) {
      case 'indigo':
        return {
          iconBg: 'radial-gradient(circle at top right, rgba(79,110,247,0.15), rgba(79,110,247,0.06))',
          iconBorder: 'rgba(79, 110, 247, 0.18)',
          iconColor: '#4f6ef7',
          accentGradient: 'linear-gradient(90deg, rgba(79,110,247,0.5), rgba(123,184,255,0.2), transparent)',
        };
      case 'emerald':
        return {
          iconBg: 'radial-gradient(circle at top right, rgba(16,185,129,0.15), rgba(16,185,129,0.06))',
          iconBorder: 'rgba(16, 185, 129, 0.18)',
          iconColor: '#10b981',
          accentGradient: 'linear-gradient(90deg, rgba(16,185,129,0.5), rgba(52,211,153,0.2), transparent)',
        };
      case 'amber':
        return {
          iconBg: 'radial-gradient(circle at top right, rgba(245,158,11,0.15), rgba(245,158,11,0.06))',
          iconBorder: 'rgba(245, 158, 11, 0.18)',
          iconColor: '#f59e0b',
          accentGradient: 'linear-gradient(90deg, rgba(245,158,11,0.5), rgba(251,191,36,0.2), transparent)',
        };
      case 'rose':
        return {
          iconBg: 'radial-gradient(circle at top right, rgba(244,63,94,0.15), rgba(244,63,94,0.06))',
          iconBorder: 'rgba(244, 63, 94, 0.18)',
          iconColor: '#f43f5e',
          accentGradient: 'linear-gradient(90deg, rgba(244,63,94,0.5), rgba(251,113,133,0.2), transparent)',
        };
      default:
        return {
          iconBg: 'radial-gradient(circle at top right, rgba(100,116,139,0.12), rgba(100,116,139,0.05))',
          iconBorder: 'rgba(100, 116, 139, 0.15)',
          iconColor: '#64748b',
          accentGradient: 'linear-gradient(90deg, rgba(100,116,139,0.4), rgba(148,163,184,0.2), transparent)',
        };
    }
  };

  const colors = getColorClasses(color);

  return (
    <div
      className="group"
      style={{
        background: 'rgba(255, 255, 255, 0.55)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.5)',
        borderRadius: '20px',
        padding: '0',
        boxShadow: '0 8px 32px rgba(30, 37, 76, 0.05)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'default',
        overflow: 'hidden',
        position: 'relative',
        ...wrapperStyle,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 14px 44px rgba(30, 37, 76, 0.1)';
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.75)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 8px 32px rgba(30, 37, 76, 0.05)';
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)';
      }}
    >
      {/* Accent gradient stripe */}
      <div style={{
        height: '3px',
        background: colors.accentGradient,
        width: '100%',
      }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 24px 0 24px' }}>
        <div>
          <p style={{
            fontSize: '11px',
            fontWeight: 600,
            color: '#6c759d',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: '8px',
          }}>
            {title}
          </p>
          <h3 style={{
            fontSize: '32px',
            fontWeight: 800,
            color: '#1e254c',
            letterSpacing: '-0.5px',
            lineHeight: 1,
          }}>
            {value}
          </h3>
        </div>

        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '14px',
          background: colors.iconBg,
          border: `1px solid ${colors.iconBorder}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.3s ease',
        }}>
          <Icon style={{ width: '24px', height: '24px', color: colors.iconColor }} />
        </div>
      </div>

      {description && (
        <p style={{
          fontSize: '12px',
          color: '#6c759d',
          marginTop: '14px',
          paddingTop: '12px',
          borderTop: '1px solid rgba(79, 110, 247, 0.06)',
          fontWeight: 500,
          padding: '12px 24px 20px 24px',
          margin: '14px 0 0 0',
        }}>
          {description}
        </p>
      )}
    </div>
  );
}
