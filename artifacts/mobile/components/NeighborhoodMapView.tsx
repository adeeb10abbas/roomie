import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { HousingListing } from '@/context/types';

const SCREEN_W = Dimensions.get('window').width;

const NEIGHBORHOOD_COORDS: Record<string, { x: number; y: number }> = {
  'Downtown':       { x: 0.50, y: 0.40 },
  'Midtown':        { x: 0.50, y: 0.30 },
  'Uptown':         { x: 0.50, y: 0.18 },
  'Mission':        { x: 0.30, y: 0.55 },
  'SoMa':           { x: 0.55, y: 0.55 },
  'Castro':         { x: 0.28, y: 0.45 },
  'Haight':         { x: 0.22, y: 0.42 },
  'Nob Hill':       { x: 0.45, y: 0.30 },
  'Financial District': { x: 0.58, y: 0.35 },
  'Marina':         { x: 0.38, y: 0.15 },
  'Richmond':       { x: 0.18, y: 0.28 },
  'Sunset':         { x: 0.15, y: 0.52 },
  'Tenderloin':     { x: 0.48, y: 0.40 },
  'Pacific Heights':{ x: 0.34, y: 0.25 },
  'Potrero Hill':   { x: 0.60, y: 0.62 },
  'Outer Sunset':   { x: 0.10, y: 0.60 },
  'North Beach':    { x: 0.52, y: 0.22 },
  'Bernal Heights': { x: 0.50, y: 0.70 },
  'Glen Park':      { x: 0.38, y: 0.70 },
  'Excelsior':      { x: 0.38, y: 0.80 },
};

function positionForNeighborhood(name: string): { x: number; y: number } {
  const direct = NEIGHBORHOOD_COORDS[name];
  if (direct) return direct;
  const lower = name.toLowerCase();
  for (const [key, val] of Object.entries(NEIGHBORHOOD_COORDS)) {
    if (key.toLowerCase().includes(lower) || lower.includes(key.toLowerCase())) return val;
  }
  const hash = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return { x: 0.2 + (hash % 60) / 100, y: 0.2 + ((hash * 7) % 60) / 100 };
}

interface Props {
  listings: HousingListing[];
  onSelectListing: (listing: HousingListing) => void;
  selectedId?: string | null;
}

export default function NeighborhoodMapView({ listings, onSelectListing, selectedId }: Props) {
  const colors = useColors();
  const [focusedNeighborhood, setFocusedNeighborhood] = useState<string | null>(null);

  const byNeighborhood = listings.reduce<Record<string, HousingListing[]>>((acc, l) => {
    if (!acc[l.neighborhood]) acc[l.neighborhood] = [];
    acc[l.neighborhood].push(l);
    return acc;
  }, {});

  const mapH = 240;
  const mapW = SCREEN_W - 32;

  const focusedListings = focusedNeighborhood ? (byNeighborhood[focusedNeighborhood] ?? []) : [];

  return (
    <View style={styles.container}>
      {/* Map Canvas */}
      <View style={[styles.mapCanvas, { width: mapW, height: mapH, backgroundColor: '#D0E8F2' }]}>
        {/* Grid lines for map feel */}
        {[0.25, 0.5, 0.75].map(p => (
          <React.Fragment key={p}>
            <View style={[styles.gridH, { top: p * mapH }]} />
            <View style={[styles.gridV, { left: p * mapW }]} />
          </React.Fragment>
        ))}
        {/* Water/park accents */}
        <View style={[styles.waterBlob, { left: 0, top: 0, width: mapW * 0.12, height: mapH * 0.6 }]} />
        <View style={[styles.parkBlob, { left: mapW * 0.13, top: mapH * 0.3, width: mapW * 0.07, height: mapH * 0.25 }]} />
        <View style={[styles.waterBlob, { right: 0, top: 0, width: mapW * 0.08, height: mapH * 0.45 }]} />

        {/* Neighborhood pins */}
        {Object.entries(byNeighborhood).map(([neighborhood, nListings]) => {
          const pos = positionForNeighborhood(neighborhood);
          const x = pos.x * mapW;
          const y = pos.y * mapH;
          const count = nListings.length;
          const isFocused = focusedNeighborhood === neighborhood;
          const isSelected = nListings.some(l => l.id === selectedId);
          const pinSize = isFocused ? 44 : 36;

          return (
            <TouchableOpacity
              key={neighborhood}
              style={[
                styles.pin,
                {
                  left: x - pinSize / 2,
                  top: y - pinSize / 2,
                  width: pinSize,
                  height: pinSize,
                  borderRadius: pinSize / 2,
                  backgroundColor: isFocused || isSelected ? colors.primary : colors.card,
                  borderColor: isFocused || isSelected ? colors.primary : colors.border,
                  shadowColor: colors.primary,
                },
              ]}
              onPress={() => setFocusedNeighborhood(isFocused ? null : neighborhood)}
            >
              <Text style={[styles.pinCount, { color: isFocused || isSelected ? '#FFF' : colors.primary }]}>
                {count}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Legend */}
      <View style={[styles.legend, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
        <Text style={[styles.legendText, { color: colors.mutedForeground }]}>
          Tap a pin to see listings in that neighborhood
        </Text>
      </View>

      {/* Focused neighborhood listings */}
      {focusedNeighborhood && focusedListings.length > 0 && (
        <View style={[styles.focusPanel, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.focusPanelHeader}>
            <Text style={[styles.focusPanelTitle, { color: colors.foreground }]}>
              {focusedNeighborhood}
            </Text>
            <TouchableOpacity onPress={() => setFocusedNeighborhood(null)}>
              <Feather name="x" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.focusScroll}>
            {focusedListings.map(listing => (
              <TouchableOpacity
                key={listing.id}
                style={[
                  styles.focusCard,
                  {
                    backgroundColor: listing.id === selectedId ? colors.primaryLight : colors.muted,
                    borderColor: listing.id === selectedId ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => onSelectListing(listing)}
              >
                <Text style={[styles.focusCardTitle, { color: colors.foreground }]} numberOfLines={1}>
                  {listing.title}
                </Text>
                <Text style={[styles.focusCardRent, { color: colors.primary }]}>
                  ${listing.rent.toLocaleString()}/mo
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginHorizontal: 16, marginBottom: 12 },
  mapCanvas: {
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  gridH: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.4)' },
  gridV: { position: 'absolute', top: 0, bottom: 0, width: 1, backgroundColor: 'rgba(255,255,255,0.4)' },
  waterBlob: { position: 'absolute', backgroundColor: 'rgba(100,180,230,0.5)' },
  parkBlob: { position: 'absolute', backgroundColor: 'rgba(120,210,130,0.45)', borderRadius: 8 },
  pin: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  pinCount: { fontSize: 13, fontWeight: '800' },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 12 },
  focusPanel: {
    marginTop: 8,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
  focusPanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  focusPanelTitle: { fontSize: 14, fontWeight: '700' },
  focusScroll: { flexGrow: 0 },
  focusCard: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    marginRight: 8,
    minWidth: 130,
    maxWidth: 160,
  },
  focusCardTitle: { fontSize: 13, fontWeight: '600', marginBottom: 2 },
  focusCardRent: { fontSize: 12, fontWeight: '700' },
});
