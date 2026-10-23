// The URL for a car's `image` path (a path under the site root, from cars.json).
//
// The one place the base path is added, so the pictures still load when the app is served from
// /lab/<id>/ and not the site root. The files live in the git-ignored public/car-images/ (D11).
export const carImageUrl = (image: string) => `${import.meta.env.BASE_URL}${image}`
