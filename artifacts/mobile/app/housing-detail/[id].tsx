import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import { getHousingImage, getProfileImage } from '@/utils/images';
import { HousingMember } from '@/context/types';

export default function HousingDetailScreen() {
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { housing, currentUser, getJoinRequests } = useApp();
  const [requested, setRequested] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const listing = housing.find(h => h.id === id);
  const isOwner = !!(listing && currentUser && currentUser.id === listing.postedBy.id);

  useEffect(() => {
    if (isOwner && id) {
      getJoinRequests(id).then((reqs) => {
        setPendingCount(reqs.filter(r => r.status === 'pending').length);
      }).catch(() => {});
    }
  }, [isOwner, id]);

  if (!listing) return null;

  const isOpenRoom = listing.type === 'permanent_room';
  const isSublet = listing.type === 'sublet';
  const spotsLeft = listing.maxRoommates - listing.currentRoommates;
  const members: HousingMember[] = listing.currentMembers ?? [];

  const handleRequest = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setRequested(true);
    Alert.alert(
      'Request Sent!',
      `Your request to join "${listing.title}" has been sent to ${listing.postedBy.name.split(' ')[0]}.`,
      [{ text: 'Great!' }]
    );
  };

  const typeBadgeColor = isOpenRoom ? colors.primary : isSublet ? '#7C3AED' : '#059669';
  const typeLabel = isOpenRoom ? 'Open Room' : isSublet ? 'Sublet' : 'Forming Group';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.hero}>
          <Image
            source={getHousingImage(listing.photoIndex)}
            style={styles.heroImage}
            contentFit="cover"
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.65)']}
            style={styles.heroGradient}
            locations={[0.4, 1]}
          />
          <View style={[styles.typeBadge, { backgroundColor: typeBadgeColor }]}>
            <Text style={styles.typeBadgeText}>{typeLabel}</Text>
          </View>
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>{listing.title}</Text>
            <Text style={styles.heroAddress}>{listing.address}</Text>
          </View>
        </View>

        <View style={styles.body}>
          {/* Key Stats */}
          <View style={[styles.statsRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Stat icon="dollar-sign" label="Rent" value={`$${listing.rent.toLocaleString()}/mo`} colors={colors} />
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <Stat icon="users" label="Spots left" value={`${spotsLeft} of ${listing.maxRoommates}`} colors={colors} />
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <Stat icon="calendar" label="Move-in" value={listing.moveInDate} colors={colors} />
          </View>

          {/* Sublet dates */}
          {isSublet && listing.subletStart && listing.subletEnd && (
            <View style={[styles.subletDates, { backgroundColor: '#F5F3FF', borderColor: '#DDD6FE' }]}>
              <Feather name="clock" size={14} color="#7C3AED" />
              <Text style={styles.subletDatesText}>
                Sublet period: {listing.subletStart} → {listing.subletEnd}
              </Text>
            </View>
          )}

          {/* Description */}
          <Section title="About this place" icon="home" colors={colors}>
            <Text style={[styles.description, { color: colors.foreground }]}>{listing.description}</Text>
          </Section>

          {/* Amenities */}
          <Section title="Amenities" icon="check-circle" colors={colors}>
            <View style={styles.amenitiesGrid}>
              {listing.amenities.map(a => (
                <View key={a} style={[styles.amenityChip, { backgroundColor: colors.muted }]}>
                  <Feather name="check" size={12} color={colors.success} />
                  <Text style={[styles.amenityText, { color: colors.foreground }]}>{a}</Text>
                </View>
              ))}
            </View>
          </Section>

          {/* House Rules */}
          <Section title="House Rules" icon="shield" colors={colors}>
            {listing.rules.map((rule, i) => (
              <View key={i} style={styles.ruleRow}>
                <View style={[styles.ruleDot, { backgroundColor: colors.primary }]} />
                <Text style={[styles.ruleText, { color: colors.foreground }]}>{rule}</Text>
              </View>
            ))}
          </Section>

          {/* Tags */}
          <Section title="Tags" icon="tag" colors={colors}>
            <View style={styles.tagsRow}>
              {listing.tags.map(tag => (
                <View key={tag} style={[styles.tag, { backgroundColor: colors.primaryLight }]}>
                  <Text style={[styles.tagText, { color: colors.primary }]}>{tag}</Text>
                </View>
              ))}
            </View>
          </Section>

          {/* Posted By */}
          <Section title="Posted by" icon="user" colors={colors}>
            <TouchableOpacity
              style={[styles.posterCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push(`/user/${listing.postedBy.id}`)}
            >
              <Image
                source={getProfileImage(listing.postedBy.photoIndex, listing.postedBy.photoUrl)}
                style={styles.posterAvatar}
                contentFit="cover"
              />
              <View style={styles.posterInfo}>
                <View style={styles.posterNameRow}>
                  <Text style={[styles.posterName, { color: colors.foreground }]}>
                    {listing.postedBy.name}
                  </Text>
                  {listing.postedBy.isVerified && (
                    <Feather name="check-circle" size={14} color="#2563EB" />
                  )}
                </View>
                <Text style={[styles.posterMeta, { color: colors.mutedForeground }]}>
                  {listing.postedBy.occupation} · {listing.postedBy.university}
                </Text>
              </View>
              <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
          </Section>

          {/* Roommates / Members */}
          {members.length > 0 && (
            <Section title="Current Roommates" icon="users" colors={colors}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.membersScroll}>
                {members.map(member => (
                  <TouchableOpacity
                    key={member.id}
                    style={[styles.memberCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={() => router.push(`/user/${member.id}`)}
                  >
                    <View style={styles.memberAvatarWrap}>
                      <Image
                        source={getProfileImage(member.photoIndex, member.photoUrl)}
                        style={styles.memberAvatar}
                        contentFit="cover"
                      />
                      {member.isVerified && (
                        <View style={[styles.memberVerifiedBadge, { backgroundColor: colors.card }]}>
                          <Feather name="check-circle" size={11} color="#2563EB" />
                        </View>
                      )}
                    </View>
                    <Text style={[styles.memberName, { color: colors.foreground }]} numberOfLines={1}>
                      {member.name.split(' ')[0]}
                    </Text>
                    {member.eduDomain && (
                      <Text style={[styles.memberEdu, { color: colors.mutedForeground }]} numberOfLines={1}>
                        .{member.eduDomain}
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </Section>
          )}

          {listing.sameGenderOnly && (
            <View style={[styles.genderNote, { backgroundColor: colors.muted }]}>
              <Feather name="shield" size={14} color={colors.mutedForeground} />
              <Text style={[styles.genderNoteText, { color: colors.mutedForeground }]}>
                Same-gender roommates only
              </Text>
            </View>
          )}

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* CTA */}
      <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
        {isOwner ? (
          <TouchableOpacity
            testID="view-requests-btn"
            style={[styles.joinBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push(`/housing-requests/${id}`)}
          >
            <View style={styles.viewRequestsContent}>
              <Text style={[styles.joinBtnText, { color: colors.primaryForeground }]}>
                View Join Requests
              </Text>
              {pendingCount > 0 && (
                <View style={styles.requestsBadge}>
                  <Text style={styles.requestsBadgeText}>{pendingCount}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ) : requested ? (
          <View style={[styles.requestedBanner, { backgroundColor: colors.success }]}>
            <Feather name="check" size={18} color="#FFFFFF" />
            <Text style={styles.requestedText}>Request Sent!</Text>
          </View>
        ) : (
          <TouchableOpacity
            testID="join-btn"
            style={[styles.joinBtn, { backgroundColor: colors.primary }]}
            onPress={handleRequest}
          >
            <Text style={[styles.joinBtnText, { color: colors.primaryForeground }]}>
              {isOpenRoom ? 'Request to Join' : isSublet ? 'Request Sublet' : 'Request to Join Group'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function Section({ title, icon, children, colors }: { title: string; icon: string; children: React.ReactNode; colors: any }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Feather name={icon as any} size={15} color={colors.primary} />
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function Stat({ icon, label, value, colors }: { icon: string; label: string; value: string; colors: any }) {
  return (
    <View style={styles.stat}>
      <Feather name={icon as any} size={16} color={colors.primary} />
      <Text style={[styles.statValue, { color: colors.foreground }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  hero: { height: 300, position: 'relative' },
  heroImage: { width: '100%', height: '100%' },
  heroGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%' },
  typeBadge: {
    position: 'absolute',
    top: 60,
    left: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  typeBadgeText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  heroContent: { position: 'absolute', bottom: 16, left: 16, right: 16 },
  heroTitle: { fontSize: 22, fontWeight: '800', color: '#FFFFFF', marginBottom: 4 },
  heroAddress: { fontSize: 13, color: 'rgba(255,255,255,0.85)' },
  body: { paddingHorizontal: 16, paddingTop: 16 },
  statsRow: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 20,
  },
  stat: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 4 },
  statValue: { fontSize: 14, fontWeight: '700' },
  statLabel: { fontSize: 11 },
  statDivider: { width: 1 },
  subletDates: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 20,
  },
  subletDatesText: { fontSize: 13, color: '#7C3AED', fontWeight: '500' },
  section: { marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  description: { fontSize: 15, lineHeight: 24 },
  amenitiesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  amenityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  amenityText: { fontSize: 13, fontWeight: '500' },
  ruleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 6 },
  ruleDot: { width: 6, height: 6, borderRadius: 3, marginTop: 6 },
  ruleText: { flex: 1, fontSize: 14, lineHeight: 20 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  tagText: { fontSize: 13, fontWeight: '600' },
  posterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  posterAvatar: { width: 48, height: 48, borderRadius: 24 },
  posterInfo: { flex: 1 },
  posterNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
  posterName: { fontSize: 15, fontWeight: '700' },
  posterMeta: { fontSize: 13 },
  membersScroll: { flexGrow: 0 },
  memberCard: {
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    marginRight: 10,
    width: 88,
    gap: 6,
  },
  memberAvatarWrap: { position: 'relative' },
  memberAvatar: { width: 52, height: 52, borderRadius: 26 },
  memberVerifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    borderRadius: 8,
    padding: 1,
  },
  memberName: { fontSize: 13, fontWeight: '600', textAlign: 'center' },
  memberEdu: { fontSize: 11, textAlign: 'center' },
  genderNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
  },
  genderNoteText: { fontSize: 13 },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  joinBtn: {
    paddingVertical: 16,
    borderRadius: 32,
    alignItems: 'center',
  },
  joinBtnText: { fontSize: 16, fontWeight: '700' },
  viewRequestsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  requestsBadge: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  requestsBadgeText: { fontSize: 12, fontWeight: '700', color: '#0284C7' },
  requestedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 32,
  },
  requestedText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
