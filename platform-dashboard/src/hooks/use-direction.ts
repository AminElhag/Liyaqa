import { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'

export type Direction = 'ltr' | 'rtl'

const RTL_LANGUAGES = ['ar']

export function useDirection() {
  const { i18n } = useTranslation()
  const direction: Direction = useMemo(
    () => (RTL_LANGUAGES.includes(i18n.language) ? 'rtl' : 'ltr'),
    [i18n.language],
  )

  useEffect(() => {
    document.documentElement.dir = direction
    document.documentElement.lang = i18n.language
  }, [direction, i18n.language])

  const toggleDirection = () => {
    const newLang = i18n.language === 'ar' ? 'en' : 'ar'
    i18n.changeLanguage(newLang)
    localStorage.setItem('language', newLang)
  }

  return { direction, isRtl: direction === 'rtl', toggleDirection } as const
}
