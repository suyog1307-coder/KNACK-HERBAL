const FEATURES = [
  {
    icon: "🌿",
    title: "100% Natural",
    description: "Every ingredient is carefully sourced from nature with full transparency.",
  },
  {
    icon: "🧪",
    title: "Dermatologist Tested",
    description: "All formulations are tested and certified safe for all skin types.",
  },
  {
    icon: "🐰",
    title: "Cruelty Free",
    description: "Never tested on animals. Certified by PETA and Leaping Bunny.",
  },
  {
    icon: "♻️",
    title: "Eco Packaging",
    description: "Recyclable, minimal packaging that's as kind to the planet as your skin.",
  },
  {
    icon: "🇮🇳",
    title: "Made in India",
    description: "Proudly crafted in India, celebrating the richness of Ayurvedic heritage.",
  },
  {
    icon: "💚",
    title: "No Nasties",
    description: "Free from parabens, sulphates, mineral oils, and artificial fragrances.",
  },
];

export function WhyKnack() {
  return (
    <section className="bg-[var(--surface-muted)] py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-12 text-center">
          <h2 className="font-display mb-2 text-2xl font-bold text-[var(--foreground)] sm:text-3xl">
            Why Knack Herbal?
          </h2>
          <p className="mx-auto max-w-md text-[var(--foreground-muted)]">
            We believe great skin starts with honest, transparent skincare.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="flex flex-col items-center gap-3 rounded-2xl bg-[var(--surface)] p-6 text-center"
            >
              <span className="text-3xl">{f.icon}</span>
              <h3 className="font-semibold text-[var(--foreground)]">{f.title}</h3>
              <p className="text-sm leading-relaxed text-[var(--foreground-muted)]">
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
