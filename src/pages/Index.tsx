import { useEffect, useState } from 'react';
import ArcGalleryHero from "@/components/ArcGalleryHero";
import func2url from '../../func2url.json';

const API = func2url['gallery'];

const FALLBACK_IMAGES = [
  "https://cdn.poehali.dev/projects/7382b3f9-d9e4-4d12-8d60-ebcc5d5c0c70/bucket/eb6d59a6-d8c1-4986-b436-7d9e4b9a051b.jpg",
  "/freepik__enhance__98192.png",
  "/LS.png",
  "/freepik__a-closeup-shot-features-a-glossy-purple-crossshape__48873.png",
  "/freepik__the-style-is-3d-model-with-octane-render-volumetri__57555.png",
  "/eqirGoRIJPaIMgEUeliWpNxeFmI.jpg",
  "/ultra-detailed_close-up_side_profile_of_a_dark-skinned_model_wearing_futuristic_chrome_wraparound_s_ps17q5ms2ptu5t6bdru6_2.png",
  "/slide.png",
  "/freepik__abstract-digital-art-featuring-a-series-of-horizon__489.png",
  "/abstract-blue-gradient.webp",
  "/VkvvhXlWo3hEBzcqwTpjd_aa4bf9ee998f4ec0b17a8bf16fe3e9e2.jpg",
  "/hyperrealistic_commercial_product_photography_of_luxury_chrome_sunglasses_on_male_model_extreme_chi_fanguv2w9zx489lcivwa_2.png",
];

const Index = () => {
  const [images, setImages] = useState<string[]>(FALLBACK_IMAGES);

  useEffect(() => {
    fetch(API)
      .then((r) => r.json())
      .then((data) => {
        if (data.photos && data.photos.length > 0) {
          setImages(data.photos.map((p: { url: string }) => p.url));
        }
      })
      .catch(() => {});
  }, []);

  return (
    <main className="relative min-h-screen bg-background">
      <ArcGalleryHero
        images={images}
        startAngle={20}
        endAngle={160}
        radiusLg={480}
        radiusMd={360}
        radiusSm={260}
        cardSizeLg={120}
        cardSizeMd={100}
        cardSizeSm={80}
        className="pt-16 pb-16 md:pt-20 md:pb-20 lg:pt-24 lg:pb-24"
      />
    </main>
  );
};

export default Index;
