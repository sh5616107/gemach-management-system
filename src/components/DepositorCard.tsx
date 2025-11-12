import { DatabaseDepositor } from '../database/database'

interface DepositorCardProps {
  depositor: DatabaseDepositor
  balance: number
  activeDepositsCount: number
  onView: () => void
  onEdit: () => void
  onDelete: () => void
}

function DepositorCard({ 
  depositor, 
  balance, 
  activeDepositsCount, 
  onView, 
  onEdit, 
  onDelete 
}: DepositorCardProps) {
  return (
    <div style={{
      border: '2px solid #3498db',
      borderRadius: '10px',
      padding: '20px',
      marginBottom: '15px',
      backgroundColor: 'white',
      boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
      transition: 'transform 0.2s, box-shadow 0.2s',
      cursor: 'pointer'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-2px)'
      e.currentTarget.style.boxShadow = '0 4px 10px rgba(0,0,0,0.15)'
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)'
      e.currentTarget.style.boxShadow = '0 2px 5px rgba(0,0,0,0.1)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#2c3e50', fontSize: '20px' }}>
            👤 {depositor.name}
          </h3>
          
          {depositor.phone && (
            <p style={{ margin: '5px 0', color: '#7f8c8d', fontSize: '14px' }}>
              📞 {depositor.phone}
            </p>
          )}
          
          {depositor.idNumber && (
            <p style={{ margin: '5px 0', color: '#7f8c8d', fontSize: '14px' }}>
              🆔 {depositor.idNumber}
            </p>
          )}
          
          <div style={{ 
            marginTop: '15px', 
            padding: '10px', 
            backgroundColor: '#ecf0f1', 
            borderRadius: '5px' 
          }}>
            <p style={{ margin: '5px 0', fontWeight: 'bold', color: '#27ae60', fontSize: '18px' }}>
              💰 יתרה: ₪{balance.toLocaleString()}
            </p>
            <p style={{ margin: '5px 0', color: '#7f8c8d', fontSize: '14px' }}>
              📊 {activeDepositsCount} הפקדות פעילות
            </p>
          </div>
          
          {depositor.notes && (
            <p style={{ 
              margin: '10px 0 0 0', 
              color: '#95a5a6', 
              fontSize: '13px',
              fontStyle: 'italic'
            }}>
              📝 {depositor.notes}
            </p>
          )}
        </div>
      </div>
      
      <div style={{ 
        display: 'flex', 
        gap: '10px', 
        marginTop: '15px',
        paddingTop: '15px',
        borderTop: '1px solid #ecf0f1'
      }}>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onView()
          }}
          style={{
            flex: 1,
            padding: '10px',
            backgroundColor: '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2980b9'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3498db'}
        >
          👁️ צפה
        </button>
        
        <button
          onClick={(e) => {
            e.stopPropagation()
            onEdit()
          }}
          style={{
            flex: 1,
            padding: '10px',
            backgroundColor: '#f39c12',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e67e22'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f39c12'}
        >
          ✏️ ערוך
        </button>
        
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          style={{
            flex: 1,
            padding: '10px',
            backgroundColor: '#e74c3c',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#c0392b'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#e74c3c'}
        >
          🗑️ מחק
        </button>
      </div>
    </div>
  )
}

export default DepositorCard
