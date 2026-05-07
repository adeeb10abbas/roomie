const PROFILE_IMAGES = [
  require('@/assets/images/profile1.png'),
  require('@/assets/images/profile2.png'),
  require('@/assets/images/profile3.png'),
  require('@/assets/images/profile4.png'),
  require('@/assets/images/profile5.png'),
];

export function getProfileImage(index: number) {
  return PROFILE_IMAGES[index % PROFILE_IMAGES.length];
}

export function getHousingImage(index: number) {
  return PROFILE_IMAGES[index % PROFILE_IMAGES.length];
}
