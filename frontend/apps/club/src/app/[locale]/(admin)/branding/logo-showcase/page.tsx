'use client'

import Image from 'next/image'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@liyaqa/shared/components/ui/card'

export default function LogoShowcasePage() {
  const logos = [
    {
      title: 'Primary Horizontal Logo',
      description: 'Main logo with contemporary Arabic calligraphy in sunset coral',
      file: '/assets/logo-liyaqa-primary.svg',
      backgrounds: ['white', 'light', 'dark', 'coral'],
    },
    {
      title: 'Vertical/Stacked Logo',
      description: 'For square formats and mobile applications',
      file: '/assets/logo-liyaqa-vertical.svg',
      backgrounds: ['white', 'light', 'dark', 'coral'],
    },
    {
      title: 'Icon-Only Mark',
      description: 'App icon and favicon - geometric fitness symbol',
      file: '/assets/logo-liyaqa-icon.svg',
      backgrounds: ['white', 'light', 'dark', 'coral'],
    },
    {
      title: 'Monochrome Black',
      description: 'For light backgrounds and monochrome printing',
      file: '/assets/logo-liyaqa-black.svg',
      backgrounds: ['white', 'light'],
    },
    {
      title: 'Monochrome White',
      description: 'For dark backgrounds and reversed applications',
      file: '/assets/logo-liyaqa-white.svg',
      backgrounds: ['dark', 'coral'],
    },
    {
      title: 'Favicon (32px)',
      description: 'Optimized for browser tabs and bookmarks',
      file: '/assets/favicon.svg',
      backgrounds: ['white', 'light', 'dark', 'coral'],
    },
  ]

  const getBackgroundClass = (bg: string) => {
    switch (bg) {
      case 'white':
        return 'bg-white border-2 border-gray-200'
      case 'light':
        return 'bg-gray-50'
      case 'dark':
        return 'bg-gray-900'
      case 'coral':
        return 'bg-[#FF6B4A]'
      default:
        return 'bg-white'
    }
  }

  return (
    <div className="container mx-auto p-8 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-50">
          Liyaqa Logo System
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">
          Contemporary Arabic Visual Identity - Phase 1 Deliverable
        </p>
      </div>

      {/* Design Specifications */}
      <Card>
        <CardHeader>
          <CardTitle>Design Specifications</CardTitle>
          <CardDescription>Contemporary calligraphic style with Arabic-first approach</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <h3 className="font-semibold text-sm text-gray-600 mb-1">Primary Color</h3>
              <div className="flex items-center gap-2">
                <div className="w-12 h-12 rounded border-2 border-gray-200" style={{ backgroundColor: '#FF6B4A' }} />
                <div>
                  <p className="font-mono text-sm">#FF6B4A</p>
                  <p className="text-xs text-gray-500">Sunset Coral</p>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-sm text-gray-600 mb-1">Secondary Color</h3>
              <div className="flex items-center gap-2">
                <div className="w-12 h-12 rounded border-2 border-gray-200" style={{ backgroundColor: '#E85D3A' }} />
                <div>
                  <p className="font-mono text-sm">#E85D3A</p>
                  <p className="text-xs text-gray-500">Terracotta</p>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-sm text-gray-600 mb-1">Style</h3>
              <p className="text-sm">Contemporary Calligraphic</p>
              <p className="text-xs text-gray-500">Diwani/Thuluth-inspired</p>
            </div>
            <div>
              <h3 className="font-semibold text-sm text-gray-600 mb-1">Grid System</h3>
              <p className="text-sm">8px base grid</p>
              <p className="text-xs text-gray-500">20% safe zone padding</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logo Variations */}
      {logos.map((logo, idx) => (
        <Card key={idx}>
          <CardHeader>
            <CardTitle>{logo.title}</CardTitle>
            <CardDescription>{logo.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {logo.backgrounds.map((bg) => (
                <div key={bg} className="space-y-2">
                  <p className="text-sm font-medium text-gray-600 capitalize">{bg} Background</p>
                  <div
                    className={`${getBackgroundClass(bg)} rounded-lg p-8 flex items-center justify-center min-h-[160px]`}
                  >
                    <Image
                      src={logo.file}
                      alt={`${logo.title} on ${bg} background`}
                      width={logo.file.includes('icon') || logo.file.includes('favicon') ? 64 : 280}
                      height={logo.file.includes('icon') || logo.file.includes('favicon') ? 64 : 80}
                      className="max-w-full h-auto"
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Usage Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Guidelines</CardTitle>
          <CardDescription>Quick reference for logo application</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-green-600 mb-2">✓ DO</h3>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Use primary horizontal logo for website headers</li>
                <li>• Use vertical logo for square social media profiles</li>
                <li>• Use icon-only for app icons and favicons</li>
                <li>• Maintain minimum 20% clear space around logo</li>
                <li>• Use monochrome versions when color is not available</li>
                <li>• Ensure background provides sufficient contrast</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-red-600 mb-2">✗ DON&apos;T</h3>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Don&apos;t stretch or distort the logo</li>
                <li>• Don&apos;t change the colors (except approved variations)</li>
                <li>• Don&apos;t add effects (shadows, outlines, gradients)</li>
                <li>• Don&apos;t rotate the logo at angles</li>
                <li>• Don&apos;t display smaller than 120px width (horizontal)</li>
                <li>• Don&apos;t place on busy backgrounds without treatment</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Technical Details */}
      <Card>
        <CardHeader>
          <CardTitle>Technical Details</CardTitle>
          <CardDescription>File specifications and export information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-semibold mb-2">File Formats</h3>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• SVG (vector, infinitely scalable)</li>
                <li>• PNG exports available in multiple sizes</li>
                <li>• @1x, @2x, @3x retina variations</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Minimum Sizes</h3>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Horizontal logo: 120px width</li>
                <li>• Vertical logo: 100px width</li>
                <li>• Icon-only: 32px × 32px</li>
                <li>• Favicon: 16px × 16px</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">File Locations</h3>
              <ul className="space-y-1 text-sm text-gray-600 font-mono text-xs">
                <li>• logo-liyaqa-primary.svg</li>
                <li>• logo-liyaqa-vertical.svg</li>
                <li>• logo-liyaqa-icon.svg</li>
                <li>• logo-liyaqa-black.svg</li>
                <li>• logo-liyaqa-white.svg</li>
                <li>• favicon.svg</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scalability Test */}
      <Card>
        <CardHeader>
          <CardTitle>Scalability Test</CardTitle>
          <CardDescription>Logo performance at different sizes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-8 p-8 bg-gray-50 rounded-lg">
            {[16, 32, 64, 128, 256].map((size) => (
              <div key={size} className="flex flex-col items-center gap-2">
                <Image
                  src="/assets/logo-liyaqa-icon.svg"
                  alt={`Logo at ${size}px`}
                  width={size}
                  height={size}
                />
                <span className="text-xs text-gray-500">{size}px</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card className="border-l-4 border-l-[#FF6B4A]">
        <CardHeader>
          <CardTitle>Phase 1 Complete - Next Steps</CardTitle>
          <CardDescription>Review and approve before proceeding to Phase 2</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            The logo system is now ready for review. Please evaluate the contemporary calligraphic style,
            color application, and scalability across different formats.
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h4 className="font-semibold text-amber-900 mb-2">Pending Actions</h4>
            <ul className="space-y-1 text-sm text-amber-800">
              <li>1. Review logo variations on this page</li>
              <li>2. Test logos in actual application contexts</li>
              <li>3. Provide feedback or request adjustments</li>
              <li>4. Upon approval, proceed to Phase 2: Color System Development</li>
            </ul>
          </div>
          <div className="pt-4">
            <h4 className="font-semibold mb-2">Upcoming Phases</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="p-3 bg-gray-50 rounded">
                <p className="font-semibold text-gray-900">Phase 2</p>
                <p className="text-gray-600">Color System</p>
              </div>
              <div className="p-3 bg-gray-50 rounded">
                <p className="font-semibold text-gray-900">Phase 3</p>
                <p className="text-gray-600">Typography</p>
              </div>
              <div className="p-3 bg-gray-50 rounded">
                <p className="font-semibold text-gray-900">Phase 4</p>
                <p className="text-gray-600">Islamic Patterns</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
