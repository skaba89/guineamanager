'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// Leaflet imports - dynamic to avoid SSR issues
import dynamic from 'next/dynamic'

// Import leaflet CSS
import 'leaflet/dist/leaflet.css'

// Dynamic import for MapComponent to avoid SSR issues
const MapContainer = dynamic(
  () => import('react-leaflet').then(mod => mod.MapContainer),
  { ssr: false }
)
const TileLayer = dynamic(
  () => import('react-leaflet').then(mod => mod.TileLayer),
  { ssr: false }
)
const CircleMarker = dynamic(
  () => import('react-leaflet').then(mod => mod.CircleMarker),
  { ssr: false }
)
const Popup = dynamic(
  () => import('react-leaflet').then(mod => mod.Popup),
  { ssr: false }
)
const Marker = dynamic(
  () => import('react-leaflet').then(mod => mod.Marker),
  { ssr: false }
)

// West African countries data with KPIs
const countriesData = [
  {
    id: 'GN',
    name: 'Guinée',
    capital: 'Conakry',
    coordinates: [9.6412, -9.9457] as [number, number],
    kpis: {
      clients: 156,
      factures: 1245,
      ca: 895000000,
      employes: 45,
      tauxCroissance: 12.5
    },
    color: '#16a34a', // green
    status: 'actif'
  },
  {
    id: 'SN',
    name: 'Sénégal',
    capital: 'Dakar',
    coordinates: [14.7167, -17.4677] as [number, number],
    kpis: {
      clients: 89,
      factures: 678,
      ca: 456000000,
      employes: 23,
      tauxCroissance: 8.3
    },
    color: '#2563eb', // blue
    status: 'actif'
  },
  {
    id: 'ML',
    name: 'Mali',
    capital: 'Bamako',
    coordinates: [12.6392, -8.0029] as [number, number],
    kpis: {
      clients: 67,
      factures: 423,
      ca: 234000000,
      employes: 15,
      tauxCroissance: 5.2
    },
    color: '#7c3aed', // purple
    status: 'actif'
  },
  {
    id: 'CI',
    name: "Côte d'Ivoire",
    capital: 'Abidjan',
    coordinates: [5.3599, -4.0083] as [number, number],
    kpis: {
      clients: 112,
      factures: 892,
      ca: 567000000,
      employes: 32,
      tauxCroissance: 15.8
    },
    color: '#ea580c', // orange
    status: 'actif'
  },
  {
    id: 'BF',
    name: 'Burkina Faso',
    capital: 'Ouagadougou',
    coordinates: [12.3686, -1.5275] as [number, number],
    kpis: {
      clients: 45,
      factures: 234,
      ca: 123000000,
      employes: 8,
      tauxCroissance: 3.5
    },
    color: '#dc2626', // red
    status: 'actif'
  },
  {
    id: 'BJ',
    name: 'Bénin',
    capital: 'Cotonou',
    coordinates: [6.3703, 2.3912] as [number, number],
    kpis: {
      clients: 34,
      factures: 156,
      ca: 89000000,
      employes: 6,
      tauxCroissance: 6.7
    },
    color: '#0891b2', // cyan
    status: 'actif'
  },
  {
    id: 'NE',
    name: 'Niger',
    capital: 'Niamey',
    coordinates: [13.5137, 2.1098] as [number, number],
    kpis: {
      clients: 28,
      factures: 98,
      ca: 56000000,
      employes: 4,
      tauxCroissance: 2.1
    },
    color: '#ca8a04', // yellow
    status: 'prospect'
  }
]

// Cities data for detailed view
const citiesData = [
  { name: 'Conakry', country: 'GN', coordinates: [9.6412, -13.5784] as [number, number], clients: 89, ca: 456000000 },
  { name: 'Nzérékoré', country: 'GN', coordinates: [7.7556, -8.8250] as [number, number], clients: 23, ca: 89000000 },
  { name: 'Kankan', country: 'GN', coordinates: [10.3833, -9.3000] as [number, number], clients: 18, ca: 67000000 },
  { name: 'Labé', country: 'GN', coordinates: [11.3167, -12.2833] as [number, number], clients: 12, ca: 45000000 },
  { name: 'Dakar', country: 'SN', coordinates: [14.6937, -17.4441] as [number, number], clients: 67, ca: 345000000 },
  { name: 'Abidjan', country: 'CI', coordinates: [5.3599, -4.0083] as [number, number], clients: 89, ca: 456000000 },
  { name: 'Bamako', country: 'ML', coordinates: [12.6392, -8.0029] as [number, number], clients: 45, ca: 189000000 },
]

// KPI metric selector
const kpiMetrics = [
  { id: 'clients', name: 'Clients', unit: '', format: 'number' },
  { id: 'factures', name: 'Factures', unit: '', format: 'number' },
  { id: 'ca', name: "Chiffre d'affaires", unit: 'GNF', format: 'currency' },
  { id: 'employes', name: 'Employés', unit: '', format: 'number' },
  { id: 'tauxCroissance', name: 'Croissance', unit: '%', format: 'percent' }
]

export default function MapDashboardPage() {
  const [selectedKpi, setSelectedKpi] = useState('clients')
  const [selectedCountry, setSelectedCountry] = useState<typeof countriesData[0] | null>(null)
  const [viewMode, setViewMode] = useState<'countries' | 'cities'>('countries')
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const formatValue = (value: number, format: string) => {
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('fr-GN', {
          style: 'decimal',
          maximumFractionDigits: 0
        }).format(value) + ' GNF'
      case 'percent':
        return value.toFixed(1) + '%'
      default:
        return new Intl.NumberFormat('fr-GN').format(value)
    }
  }

  const getKpiValue = (data: typeof countriesData[0]) => {
    return data.kpis[selectedKpi as keyof typeof data.kpis]
  }

  const getRadius = (value: number) => {
    const metric = kpiMetrics.find(m => m.id === selectedKpi)
    if (metric?.format === 'currency') {
      return Math.max(15, Math.min(60, value / 15000000))
    }
    if (metric?.format === 'percent') {
      return Math.max(15, Math.min(60, value * 3))
    }
    return Math.max(15, Math.min(60, value / 3))
  }

  const getTotalKpi = () => {
    return countriesData.reduce((sum, country) => sum + (country.kpis[selectedKpi as keyof typeof country.kpis] as number), 0)
  }

  const selectedMetric = kpiMetrics.find(m => m.id === selectedKpi)

  if (!isClient) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Carte Interactive</h1>
          <p className="text-muted-foreground">
            Couverture géographique et KPIs par pays
          </p>
        </div>

        <div className="flex items-center gap-4">
          <Select value={selectedKpi} onValueChange={setSelectedKpi}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Sélectionner KPI" />
            </SelectTrigger>
            <SelectContent>
              {kpiMetrics.map(metric => (
                <SelectItem key={metric.id} value={metric.id}>
                  {metric.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex border rounded-lg overflow-hidden">
            <Button
              variant={viewMode === 'countries' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('countries')}
              className="rounded-none"
            >
              Pays
            </Button>
            <Button
              variant={viewMode === 'cities' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('cities')}
              className="rounded-none"
            >
              Villes
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-emerald-600">
              {formatValue(getTotalKpi(), selectedMetric?.format || 'number')}
            </div>
            <p className="text-sm text-muted-foreground">Total {selectedMetric?.name}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{countriesData.length}</div>
            <p className="text-sm text-muted-foreground">Pays actifs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">
              {viewMode === 'countries' ? countriesData.length : citiesData.length}
            </div>
            <p className="text-sm text-muted-foreground">
              {viewMode === 'countries' ? 'Zones couvertes' : 'Villes actives'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-purple-600">
              {countriesData.reduce((sum, c) => sum + c.kpis.employes, 0)}
            </div>
            <p className="text-sm text-muted-foreground">Employés total</p>
          </CardContent>
        </Card>
      </div>

      {/* Map Container */}
      <Card>
        <CardContent className="p-0">
          <div className="h-[600px] w-full rounded-lg overflow-hidden">
            <MapContainer
              center={[10, -8]}
              zoom={5}
              style={{ height: '100%', width: '100%' }}
              className="z-0"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* Country Markers */}
              {viewMode === 'countries' && countriesData.map(country => {
                const value = getKpiValue(country) as number
                const radius = getRadius(value)
                
                return (
                  <CircleMarker
                    key={country.id}
                    center={country.coordinates}
                    radius={radius}
                    pathOptions={{
                      fillColor: country.color,
                      color: country.color,
                      weight: 2,
                      opacity: 0.8,
                      fillOpacity: 0.5
                    }}
                    eventHandlers={{
                      click: () => setSelectedCountry(country)
                    }}
                  >
                    <Popup>
                      <div className="p-2 min-w-[200px]">
                        <div className="flex items-center gap-2 mb-3">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: country.color }}
                          />
                          <h3 className="font-bold text-lg">{country.name}</h3>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Clients:</span>
                            <span className="font-medium">{country.kpis.clients}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Factures:</span>
                            <span className="font-medium">{country.kpis.factures}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">CA:</span>
                            <span className="font-medium">{formatValue(country.kpis.ca, 'currency')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Employés:</span>
                            <span className="font-medium">{country.kpis.employes}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Croissance:</span>
                            <span className="font-medium text-emerald-600">+{country.kpis.tauxCroissance}%</span>
                          </div>
                        </div>
                      </div>
                    </Popup>
                  </CircleMarker>
                )
              })}

              {/* City Markers */}
              {viewMode === 'cities' && citiesData.map((city, index) => {
                const radius = Math.max(10, Math.min(40, city.clients / 3))
                const country = countriesData.find(c => c.id === city.country)
                
                return (
                  <CircleMarker
                    key={index}
                    center={city.coordinates}
                    radius={radius}
                    pathOptions={{
                      fillColor: country?.color || '#16a34a',
                      color: country?.color || '#16a34a',
                      weight: 2,
                      opacity: 0.8,
                      fillOpacity: 0.5
                    }}
                  >
                    <Popup>
                      <div className="p-2">
                        <h3 className="font-bold">{city.name}</h3>
                        <p className="text-sm text-gray-500">{country?.name}</p>
                        <div className="mt-2 text-sm">
                          <div>Clients: {city.clients}</div>
                          <div>CA: {formatValue(city.ca, 'currency')}</div>
                        </div>
                      </div>
                    </Popup>
                  </CircleMarker>
                )
              })}
            </MapContainer>
          </div>
        </CardContent>
      </Card>

      {/* Country Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Légende - {selectedMetric?.name}</CardTitle>
          <CardDescription>
            La taille des cercles représente l'importance du KPI sélectionné
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {countriesData.map(country => {
              const value = getKpiValue(country) as number
              return (
                <div
                  key={country.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                    selectedCountry?.id === country.id ? 'border-emerald-500 bg-emerald-50' : ''
                  }`}
                  onClick={() => setSelectedCountry(country)}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: country.color }}
                    />
                    <span className="font-medium text-sm">{country.name}</span>
                  </div>
                  <div className="text-lg font-bold" style={{ color: country.color }}>
                    {formatValue(value, selectedMetric?.format || 'number')}
                  </div>
                  <Badge variant="outline" className="mt-1 text-xs">
                    {country.status === 'actif' ? 'Actif' : 'Prospect'}
                  </Badge>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Selected Country Details */}
      {selectedCountry && (
        <Card className="border-2" style={{ borderColor: selectedCountry.color }}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-6 h-6 rounded-full"
                  style={{ backgroundColor: selectedCountry.color }}
                />
                <div>
                  <CardTitle>{selectedCountry.name}</CardTitle>
                  <CardDescription>Capital: {selectedCountry.capital}</CardDescription>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedCountry(null)}>
                ✕
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <div className="text-2xl font-bold text-emerald-600">{selectedCountry.kpis.clients}</div>
                <div className="text-sm text-muted-foreground">Clients</div>
              </div>
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{selectedCountry.kpis.factures}</div>
                <div className="text-sm text-muted-foreground">Factures</div>
              </div>
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{formatValue(selectedCountry.kpis.ca, 'currency')}</div>
                <div className="text-sm text-muted-foreground">CA</div>
              </div>
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{selectedCountry.kpis.employes}</div>
                <div className="text-sm text-muted-foreground">Employés</div>
              </div>
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">+{selectedCountry.kpis.tauxCroissance}%</div>
                <div className="text-sm text-muted-foreground">Croissance</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
