// Lazy load modules - chỉ import khi cần
export default async function getVietnameseMessages() {
  const [common, home, explore] = await Promise.all([
    import('./common.json').then(m => m.default),
    import('./home.json').then(m => m.default),
    import('./explore.json').then(m => m.default),
  ]);

  return {
    common,
    home,
    explore,
  };
}
