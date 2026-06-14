import React from 'react';

export default function StatCard({ title, value, icon: Icon, color, description }) {
  const getColorClasses = (color) => {
    switch (color) {
      case 'indigo':
        return {
          iconBg: 'rgba(79, 110, 247, 0.1)',
          iconBorder: 'rgba(79, 110, 247, 0.15)',
          iconColor: '#4f6ef7',
        };
      case 'emerald':
        return {
          iconBg: 'rgba(16, 185, 129, 0.1)',
          iconBorder: 'rgba(16, 185, 129, 0.15)',
          iconColor: '#10b981',
        };
      case 'amber':
        return {
          iconBg: 'rgba(245, 158, 11, 0.1)',
          iconBorder: 'rgba(245, 158, 11, 0.15)',
          iconColor: '#f59e0b',
        };
      case 'rose':
        return {
          iconBg: 'rgba(244, 63, 94, 0.1)',
          iconBorder: 'rgba(244, 63, 94, 0.15)',
          iconColor: '#f43f5e',
        };
      default:
        return {
          iconBg: 'rgba(100, 116, 139, 0.1)',
          iconBorder: 'rgba(100, 116, 139, 0.15)',
          iconColor: '#64748b',
        };
    }
  };

  const style = getColorClasses(color);

  return (
    <div
      className="group"
      style={{
        background: 'rgba(255, 255, 255, 0.55)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.5)',
        borderRadius: '20px',
        padding: '24px',
        boxShadow: '0 8px 32px rgba(30, 37, 76, 0.05)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'default',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.boxShadow = '0 12px 40px rgba(30, 37, 76, 0.09)';
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.75)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 8px 32px rgba(30, 37, 76, 0.05)';
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
          background: style.iconBg,
          border: `1px solid ${style.iconBorder}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.3s ease',
        }}>
          <Icon style={{ width: '24px', height: '24px', color: style.iconColor }} />
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
        }}>
          {description}
        </p>
      )}
    </div>
  );
}
