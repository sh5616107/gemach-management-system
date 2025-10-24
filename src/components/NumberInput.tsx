import { useState, useEffect } from 'react'

interface NumberInputProps {
  value: number
  onChange: (value: number) => void
  placeholder?: string
  style?: React.CSSProperties
  className?: string
  readOnly?: boolean
}

function NumberInput({ value, onChange, placeholder, style, className, readOnly }: NumberInputProps) {
  const [displayValue, setDisplayValue] = useState('')

  // עדכן תצוגה כשהערך משתנה מבחוץ
  useEffect(() => {
    if (value === 0) {
      setDisplayValue('')
    } else {
      setDisplayValue(value.toLocaleString())
    }
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    
    // הסר פסיקים ורווחים, השאר רק מספרים
    const cleanValue = inputValue.replace(/[^\d]/g, '')
    
    // המר למספר
    const numericValue = cleanValue === '' ? 0 : parseInt(cleanValue, 10)
    
    // עדכן את הערך הנומרי
    onChange(numericValue)
    
    // עדכן את התצוגה עם פסיקים
    if (cleanValue === '') {
      setDisplayValue('')
    } else {
      setDisplayValue(numericValue.toLocaleString())
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // אפשר מספרים ומקשי בקרה
    const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight', 'Home', 'End']
    const isNumber = /^[0-9]$/.test(e.key)
    const isAllowedKey = allowedKeys.includes(e.key)
    const isCtrlKey = e.ctrlKey && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase())
    
    if (!isNumber && !isAllowedKey && !isCtrlKey) {
      e.preventDefault()
    }
  }



  return (
    <input
      type="text"
      value={displayValue}
      onChange={handleChange}
      onKeyDown={handleKeyDown}

      placeholder={placeholder}
      readOnly={readOnly}
      style={{
        textAlign: 'right',
        direction: 'ltr',
        ...style
      }}
      className={className}
    />
  )
}

export default NumberInput