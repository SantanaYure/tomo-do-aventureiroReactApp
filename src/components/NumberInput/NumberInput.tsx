import { forwardRef, useEffect, useRef, useState } from 'react'
import type { ChangeEvent, FocusEvent, InputHTMLAttributes } from 'react'

type NativeProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'value' | 'defaultValue' | 'onChange' | 'type'
>

export interface NumberInputProps extends NativeProps {
  value: number
  onChange: (value: number) => void
  emptyValue?: number
}

export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  function NumberInput(
    { value, onChange, emptyValue = 0, onFocus, onBlur, ...rest },
    ref,
  ) {
    const [buffer, setBuffer] = useState<string>(() =>
      Number.isFinite(value) ? String(value) : '',
    )
    const isFocusedRef = useRef(false)

    useEffect(() => {
      if (isFocusedRef.current) {
        return
      }

      const parsed = Number(buffer)
      const incoming = Number.isFinite(value) ? value : emptyValue

      if (buffer === '' || !Number.isFinite(parsed) || parsed !== incoming) {
        setBuffer(String(incoming))
      }
    }, [value, emptyValue, buffer])

    function handleFocus(event: FocusEvent<HTMLInputElement>) {
      isFocusedRef.current = true
      onFocus?.(event)
    }

    function handleChange(event: ChangeEvent<HTMLInputElement>) {
      const next = event.target.value
      setBuffer(next)

      if (next === '') {
        return
      }

      const parsed = Number(next)
      if (Number.isFinite(parsed) && parsed !== value) {
        onChange(parsed)
      }
    }

    function handleBlur(event: FocusEvent<HTMLInputElement>) {
      isFocusedRef.current = false

      const parsed = Number(buffer)
      const isEmpty = buffer === ''
      const isInvalid = !Number.isFinite(parsed)

      if (isEmpty || isInvalid) {
        setBuffer(String(emptyValue))
        if (value !== emptyValue) {
          onChange(emptyValue)
        }
      } else if (parsed !== value) {
        setBuffer(String(value))
      }

      onBlur?.(event)
    }

    return (
      <input
        ref={ref}
        {...rest}
        type="number"
        value={buffer}
        onFocus={handleFocus}
        onChange={handleChange}
        onBlur={handleBlur}
      />
    )
  },
)
