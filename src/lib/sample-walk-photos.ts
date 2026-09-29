/**
 * Stand-in walking photos for the photo-heavy heroes (Parallax, 3D
 * Marquee). Organisers' own Homepage photos go first and push these out one
 * by one, so adding photos is how they get replaced.
 */
const photo = (id: string) => `https://images.unsplash.com/photo-${id}?w=800&q=70&auto=format&fit=crop`;

export const SAMPLE_WALK_PHOTOS: { src: string; alt: string }[] = [
  { alt: "On the trail", src: photo("1551632811-561732d1e306") },
  { alt: "Forest path", src: photo("1441974231531-c6227db76b6e") },
  { alt: "Morning fog", src: photo("1470071459604-3b5ec3a7fe05") },
  { alt: "Hilltop sunset", src: photo("1500534623283-312aade485b7") },
  { alt: "Boardwalk through the trees", src: photo("1447752875215-b2761acb3c5d") },
  { alt: "Green hills", src: photo("1472214103451-9374bd1c798e") },
  { alt: "Valley meadow", src: photo("1426604966848-d7adac402bff") },
  { alt: "Waterfall bridge", src: photo("1433086966358-54859d0ed716") },
  { alt: "Mountain lake", src: photo("1464822759023-fed622ff2c3b") },
  { alt: "Sunlit moor", src: photo("1469474968028-56623f02e42e") },
  { alt: "Lakeside", src: photo("1501785888041-af3ef285b470") },
  { alt: "Above the clouds", src: photo("1506905925346-21bda4d32df4") },
];
