<?php

namespace Database\Seeders;

use App\Models\Amenity;
use App\Models\Business;
use App\Models\Category;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use RuntimeException;

/**
 * High-volume synthetic dataset for development and testing (D7-27).
 *
 * Populates ~300 businesses and ~18,000 reviews spanning 24+ months of
 * activity for the Costa Rican Caribbean (Puerto Viejo de Talamanca,
 * Cahuita, Cocles, Manzanillo, Hone Creek, and nearby towns). A curated
 * subset of businesses uses real names, categories, and towns verified
 * from public Wikivoyage listings; every other field — and every review,
 * rating, and activity figure — is synthetic demo data, never genuine
 * customer information. See docs/volume-seed.md.
 *
 * Run after a clean database (php artisan migrate:fresh), then:
 *   php artisan db:seed --class=Database\\Seeders\\CaribbeanVolumeSeeder
 *
 * Configuration (env, all optional):
 *   SEED_VOLUME_BUSINESSES       total businesses to create (default 300, min 34)
 *   SEED_VOLUME_REVIEWS          approximate total reviews (default 18000)
 *   SEED_VOLUME_MONTHS           months of history (default 25, min 24)
 *   SEED_VOLUME_OWNERS           owner users to pool from (default 60)
 *   SEED_VOLUME_REFERENCE_DATE   last day of activity, Y-m-d (default today)
 *
 * Idempotent by design: businesses are keyed by name (skipped when the name
 * already exists) and reviews are generated only for businesses created in
 * this run, so a second run creates nothing. The documented workflow is to
 * clean the whole database first (migrate:fresh), then fill it with this
 * seeder. Development/testing only — never run against production.
 */
class CaribbeanVolumeSeeder extends Seeder
{
    /**
     * Fixed RNG seed so a given (reference date, config) pair always yields
     * the same dataset, matching the deterministic convention of
     * BusinessDataSeeder (D7-15).
     */
    private const RNG_SEED = 2026;

    /**
     * Approximate town-centre coordinates for the southern Caribbean of
     * Limón Province. Puerto Viejo (9.6553, -82.7547) and Cahuita (9.7311,
     * -82.8450) come from Wikivoyage geo parameters; the remaining towns are
     * public approximations. Individual business coordinates are jittered
     * ±0.01° around these centres and are placeholders, not real addresses.
     *
     * @var array<string, array{label: string, lat: float, lng: float, weight: int}>
     */
    private const TOWNS = [
        'puerto_viejo' => ['label' => 'Puerto Viejo de Talamanca', 'lat' => 9.6553, 'lng' => -82.7547, 'weight' => 40],
        'cahuita' => ['label' => 'Cahuita', 'lat' => 9.7311, 'lng' => -82.8450, 'weight' => 14],
        'cocles' => ['label' => 'Playa Cocles', 'lat' => 9.6380, 'lng' => -82.7610, 'weight' => 16],
        'punta_uva' => ['label' => 'Punta Uva', 'lat' => 9.5930, 'lng' => -82.7660, 'weight' => 7],
        'playa_chiquita' => ['label' => 'Playa Chiquita', 'lat' => 9.6170, 'lng' => -82.7690, 'weight' => 7],
        'manzanillo' => ['label' => 'Manzanillo', 'lat' => 9.5790, 'lng' => -82.7770, 'weight' => 8],
        'hone_creek' => ['label' => 'Hone Creek', 'lat' => 9.6640, 'lng' => -82.7700, 'weight' => 5],
        'limon' => ['label' => 'Limón', 'lat' => 9.9900, 'lng' => -83.0300, 'weight' => 3],
    ];

    /**
     * Monthly activity multipliers for Caribbean Costa Rica tourism: the dry
     * high season (Dec-Apr) and the North-American summer (Jul-Aug) are busy;
     * the green-season trough (Sep-Nov) is quiet.
     *
     * @var array<int, float>
     */
    private const SEASONALITY = [
        1 => 1.20, 2 => 1.20, 3 => 1.25, 4 => 1.15,
        5 => 0.90, 6 => 1.00, 7 => 1.15, 8 => 1.15,
        9 => 0.75, 10 => 0.70, 11 => 0.85, 12 => 1.25,
    ];

    /**
     * Real businesses verified against public Wikivoyage listings for Puerto
     * Viejo de Talamanca and Cahuita (CC BY-SA; several listings updated
     * through Dec 2025). Only name, category, and town are taken from those
     * listings — no contact details, coordinates, or descriptions are copied,
     * and every review attached to them is synthetic.
     *
     * @var list<array{name: string, slug: string, type: string, town: string}>
     */
    private const REAL_BUSINESSES = [
        // Restaurants — Puerto Viejo de Talamanca.
        ['name' => 'Chili Rojo', 'slug' => 'restaurants', 'type' => 'Thai fusion restaurant', 'town' => 'puerto_viejo'],
        ['name' => 'De Paso', 'slug' => 'restaurants', 'type' => 'Seafood restaurant', 'town' => 'puerto_viejo'],
        ['name' => 'Pan Pay', 'slug' => 'restaurants', 'type' => 'Beachfront bakery cafe', 'town' => 'puerto_viejo'],
        ['name' => 'Pizza Boruca', 'slug' => 'restaurants', 'type' => 'Pizzeria', 'town' => 'puerto_viejo'],
        ['name' => 'Soda Lydia', 'slug' => 'restaurants', 'type' => 'Soda', 'town' => 'puerto_viejo'],
        ['name' => 'Tasty Waves Cantina', 'slug' => 'restaurants', 'type' => 'Bar and grill', 'town' => 'puerto_viejo'],
        ['name' => "Veronica's Place", 'slug' => 'restaurants', 'type' => 'Vegetarian restaurant', 'town' => 'puerto_viejo'],
        ['name' => 'Sel et Sucre', 'slug' => 'restaurants', 'type' => 'Crêperie', 'town' => 'puerto_viejo'],
        // Restaurants — Playa Cocles.
        ['name' => 'Restaurante Mediterraneo', 'slug' => 'restaurants', 'type' => 'Italian restaurant', 'town' => 'cocles'],
        ['name' => 'Peace and Love Bread and Coffee', 'slug' => 'restaurants', 'type' => 'Cafe', 'town' => 'cocles'],
        // Hotels — Puerto Viejo de Talamanca / Playa Negra.
        ['name' => "Rocking J's", 'slug' => 'hotels', 'type' => 'Hostel', 'town' => 'puerto_viejo'],
        ['name' => 'Pura Vida', 'slug' => 'hotels', 'type' => 'Hostel', 'town' => 'puerto_viejo'],
        ['name' => 'Hotel Los Sueños', 'slug' => 'hotels', 'type' => 'Hostel', 'town' => 'puerto_viejo'],
        ['name' => 'Hotel Banana Azul', 'slug' => 'hotels', 'type' => 'Boutique hotel', 'town' => 'puerto_viejo'],
        ['name' => 'Lizard King Resort', 'slug' => 'hotels', 'type' => 'Hotel with restaurant', 'town' => 'puerto_viejo'],
        ['name' => 'Be My Guest Cabinas', 'slug' => 'hotels', 'type' => 'Cabinas', 'town' => 'puerto_viejo'],
        // Hotels — Playa Cocles / Punta Uva / Playa Chiquita / Manzanillo.
        ['name' => 'Cariblue Beach & Jungle Resort', 'slug' => 'hotels', 'type' => 'Beach resort', 'town' => 'cocles'],
        ['name' => 'La Finca Chica', 'slug' => 'hotels', 'type' => 'Cabinas', 'town' => 'cocles'],
        ['name' => 'Cabinas El Tesoro', 'slug' => 'hotels', 'type' => 'Cabinas', 'town' => 'cocles'],
        ['name' => 'Geckoes Lodge', 'slug' => 'hotels', 'type' => 'Lodge', 'town' => 'cocles'],
        ['name' => 'Tree House Lodge', 'slug' => 'hotels', 'type' => 'Eco-lodge', 'town' => 'punta_uva'],
        ['name' => 'Hotel Shawandha Lodge', 'slug' => 'hotels', 'type' => 'Eco-lodge', 'town' => 'playa_chiquita'],
        ['name' => 'Green Rentals', 'slug' => 'hotels', 'type' => 'Vacation home rental', 'town' => 'playa_chiquita'],
        ['name' => 'Congo-Bongo', 'slug' => 'hotels', 'type' => 'Eco-lodge', 'town' => 'manzanillo'],
        // Hotels — Cahuita.
        ['name' => 'El Encanto Bed & Breakfast', 'slug' => 'hotels', 'type' => 'Bed and breakfast', 'town' => 'cahuita'],
        ['name' => 'Hotel Magellan Inn', 'slug' => 'hotels', 'type' => 'Hotel', 'town' => 'cahuita'],
        ['name' => 'La Piscina Natural', 'slug' => 'hotels', 'type' => 'Hotel', 'town' => 'cahuita'],
        ['name' => 'Secret Garden', 'slug' => 'hotels', 'type' => 'Hostel', 'town' => 'cahuita'],
        ['name' => 'Hotel Jaguar', 'slug' => 'hotels', 'type' => 'Hotel', 'town' => 'cahuita'],
        // Tours.
        ['name' => 'Totem Surf School', 'slug' => 'tours', 'type' => 'Surf school', 'town' => 'cocles'],
        ['name' => "Delroy's Tours", 'slug' => 'tours', 'type' => 'Guided tour operator', 'town' => 'puerto_viejo'],
        ['name' => 'Iguana Verde Foundation', 'slug' => 'tours', 'type' => 'Wildlife conservation tour', 'town' => 'puerto_viejo'],
        ['name' => 'Aviarios del Caribe', 'slug' => 'tours', 'type' => 'Wildlife refuge tour', 'town' => 'cahuita'],
        ['name' => 'Tree of Life', 'slug' => 'tours', 'type' => 'Wildlife rescue centre and botanical garden', 'town' => 'cahuita'],
    ];

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        mt_srand(self::RNG_SEED);
        srand(self::RNG_SEED);

        $this->call([CategorySeeder::class, AmenitySeeder::class]);
        $this->ensureDemoUser();

        $referenceDate = $this->referenceDate();
        $months = max(24, (int) env('SEED_VOLUME_MONTHS', 25));
        $businessTarget = max(count(self::REAL_BUSINESSES), (int) env('SEED_VOLUME_BUSINESSES', 300));
        $reviewTarget = max(1000, (int) env('SEED_VOLUME_REVIEWS', 18000));
        $ownerTarget = max(1, (int) env('SEED_VOLUME_OWNERS', 60));

        $windowStart = $referenceDate->startOfMonth()->subMonths($months - 1);

        $categories = Category::query()
            ->whereIn('slug', ['hotels', 'restaurants', 'tours'])
            ->get()
            ->keyBy('slug');

        if ($categories->count() !== 3) {
            throw new RuntimeException('Seed the Hotels, Restaurants, and Tours categories before volume data.');
        }

        $amenityIds = Amenity::query()->pluck('id');

        if ($amenityIds->isEmpty()) {
            throw new RuntimeException('Seed amenities before volume data.');
        }

        $owners = $this->ensureOwners($ownerTarget);

        $existingNames = Business::query()
            ->pluck('name')
            ->map(fn (string $name) => mb_strtolower($name))
            ->all();

        $specs = $this->businessSpecs($businessTarget, $windowStart, $referenceDate, $existingNames);

        $created = $this->createBusinesses($specs, $categories, $amenityIds, $owners, $windowStart, $referenceDate);

        $reviewRows = $this->reviewRows($created, $reviewTarget, $referenceDate);

        foreach (array_chunk($reviewRows, 500) as $chunk) {
            DB::table('reviews')->insert($chunk);
        }

        $coveredMonths = DB::table('reviews')
            ->whereBetween('review_date', [$windowStart->toDateString(), $referenceDate->toDateString()])
            ->selectRaw('count(DISTINCT date_trunc(\'month\', review_date)) as covered')
            ->value('covered');

        $this->command?->info(sprintf(
            'Volume seed complete: %d businesses, %d reviews, %d distinct months of activity (%s to %s).',
            count($created),
            count($reviewRows),
            (int) $coveredMonths,
            $windowStart->toDateString(),
            $referenceDate->toDateString(),
        ));
    }

    /**
     * Last day of generated activity: SEED_VOLUME_REFERENCE_DATE (Y-m-d) or
     * today. A bad value is a configuration error, not something to guess.
     */
    private function referenceDate(): CarbonImmutable
    {
        $raw = env('SEED_VOLUME_REFERENCE_DATE');

        if ($raw === null || $raw === '') {
            return CarbonImmutable::today();
        }

        $parsed = \DateTimeImmutable::createFromFormat('Y-m-d', trim($raw));
        $errors = \DateTimeImmutable::getLastErrors();

        if ($parsed === false
            || ($errors !== false && ($errors['warning_count'] > 0 || $errors['error_count'] > 0))
            || $parsed->format('Y-m-d') !== trim($raw)) {
            throw new RuntimeException('SEED_VOLUME_REFERENCE_DATE must be a valid Y-m-d date.');
        }

        return CarbonImmutable::instance($parsed);
    }

    /**
     * The demo login used by docs/setup.md and the smoke test, ensured so the
     * clean-then-fill workflow keeps a working account.
     */
    private function ensureDemoUser(): void
    {
        // Always build the factory attributes (even when the user already
        // exists) so the seeded RNG consumes an identical draw sequence on
        // every run — the idempotence contract depends on it.
        $attributes = User::factory()->raw(['name' => 'Test User', 'email' => 'test@example.com']);

        User::query()->firstOrCreate(
            ['email' => 'test@example.com'],
            $attributes,
        );
    }

    /**
     * A round-robin pool of owner accounts for businesses. Emails are
     * deterministic and the create is idempotent.
     *
     * @return list<User>
     */
    private function ensureOwners(int $ownerTarget): array
    {
        $owners = [];

        for ($i = 1; $i <= $ownerTarget; $i++) {
            $email = sprintf('volume.owner.%03d@example.test', $i);

            // Attributes built unconditionally; see ensureDemoUser().
            $attributes = User::factory()->raw(['email' => $email]);

            $owners[] = User::query()->firstOrCreate(
                ['email' => $email],
                $attributes,
            );
        }

        return $owners;
    }

    /**
     * Build one spec per business to create: the real verified list first
     * (skipping names that already exist in the database), then fictional
     * fill up to the target. Each spec carries its opening date and activity
     * tier, which later drive review generation.
     *
     * @param  list<string>  $existingNames
     * @return list<array<string, mixed>>
     */
    private function businessSpecs(int $businessTarget, CarbonImmutable $windowStart, CarbonImmutable $referenceDate, array $existingNames): array
    {
        $existing = array_flip($existingNames);
        $specs = [];

        // RNG discipline: every iteration below consumes the same random
        // draws (via finalizeSpec) whether or not the business ends up being
        // created, so a re-run regenerates the identical name sequence and
        // skips everything already seeded — the idempotence contract depends
        // on it (docs/volume-seed.md).
        foreach (self::REAL_BUSINESSES as $entry) {
            $alreadySeeded = isset($existing[mb_strtolower($entry['name'])]);

            $spec = $this->finalizeSpec([
                'name' => $entry['name'],
                'slug' => $entry['slug'],
                'type' => $entry['type'],
                'town' => $entry['town'],
                'is_real' => true,
                'website' => null,
                'description' => sprintf(
                    '%s is a %s in %s. Only the name, category, and town of this listing come from public '
                    .'sources; contact details, coordinates, and reviews on this record are synthetic demo data.',
                    $entry['name'],
                    mb_strtolower($entry['type']),
                    self::TOWNS[$entry['town']]['label'],
                ),
            ], $windowStart, $referenceDate, $existing);

            if (! $alreadySeeded) {
                $specs[] = $spec;
            }
        }

        // Loop length depends only on the target (never on how many records
        // already exist) so every run consumes the identical name-draw
        // sequence: run 1 creates them, run 2 re-draws the same names and
        // skips them all.
        $needed = max(0, $businessTarget - count(self::REAL_BUSINESSES));

        for ($i = 0; $i < $needed; $i++) {
            $spec = $this->fictionalSpec();

            // A fictional name that already exists in the database means it
            // was seeded by a previous run — skip it instead of duplicating.
            $alreadySeeded = isset($existing[mb_strtolower($spec['name'])]);

            $spec = $this->finalizeSpec($spec, $windowStart, $referenceDate, $existing);

            if (! $alreadySeeded) {
                $specs[] = $spec;
            }
        }

        return $specs;
    }

    /**
     * Raw fictional attributes (before uniqueness/opening/tier decisions).
     *
     * @return array<string, mixed>
     */
    private function fictionalSpec(): array
    {
        $roll = mt_rand(1, 100);
        $slug = $roll <= 40 ? 'hotels' : ($roll <= 75 ? 'restaurants' : 'tours');

        $name = $this->fictionalName($slug);
        $town = $this->pickTown();

        return [
            'name' => $name,
            'slug' => $slug,
            'type' => $this->typeFor($slug, $name),
            'town' => $town,
            'is_real' => false,
            'website' => mt_rand(1, 100) <= 30
                ? 'https://'.Str::slug($name).'.demo.caribeops.test'
                : null,
            'description' => $this->fictionalDescription($slug, $name, self::TOWNS[$town]['label']),
        ];
    }

    /**
     * Add town placement, contact placeholders, opening date, tier, quality,
     * and ownership to a raw spec. Names are registered in $existing (by
     * lower-case) so later specs can detect collisions; the caller is
     * responsible for skipping names that already exist in the database.
     *
     * @param  array<string, mixed>  $spec
     * @param  array<int, string>  $existing
     * @return array<string, mixed>
     */
    private function finalizeSpec(array $spec, CarbonImmutable $windowStart, CarbonImmutable $referenceDate, array &$existing): array
    {
        $existing[mb_strtolower($spec['name'])] = true;

        $town = self::TOWNS[$spec['town']];
        $street = $spec['town'] === 'limon'
            ? 'Av. 1'
            : ['Calle Main', 'Calle Cocles', 'Calle 5', 'Calle del Surf', 'Calle Cahuita', 'Camino a Playa Negra', 'Calle del Rio', 'Av. del Caribe', 'Calle del Sol', 'Calle Uva'][mt_rand(0, 9)];

        $opening = $this->openingDate($windowStart, $referenceDate);
        $tierRoll = mt_rand(1, 100);

        // Real-name businesses get a neutral-high quality band (3.8-4.8): a
        // synthetic low rating attributed to a real, publicly listed business
        // would read as a fabricated negative claim about it. Exactly one
        // draw is consumed regardless of branch, keeping the RNG sequence
        // (and therefore idempotence) identical for every spec.
        $quality = $spec['is_real']
            ? 3.8 + mt_rand(0, 10) / 10
            : ($tierRoll <= 15
                ? 4.4 + mt_rand(0, 5) / 10
                : ($tierRoll <= 50 ? 3.4 + mt_rand(0, 7) / 10 : 2.0 + mt_rand(0, 10) / 10));

        return $spec + [
            'address' => $spec['is_real']
                ? sprintf('%s, Limon, Costa Rica', $town['label'])
                : sprintf('%s, %s, Limon, Costa Rica', $street, $town['label']),
            'latitude' => round($town['lat'] + mt_rand(-1000, 1000) / 100000, 7),
            'longitude' => round($town['lng'] + mt_rand(-1000, 1000) / 100000, 7),
            'phone' => sprintf('+506 2000-%04d', mt_rand(0, 9999)),
            'opening' => $opening,
            'tier' => $tierRoll <= 15 ? 'high' : ($tierRoll <= 50 ? 'medium' : 'low'),
            'quality' => $quality,
        ];
    }

    /**
     * Opening dates: ~25% legacy businesses that predate the window, ~5%
     * opened within the last 7 days (keeps the dashboard's new-businesses
     * KPI non-zero), the rest spread evenly across the window.
     */
    private function openingDate(CarbonImmutable $windowStart, CarbonImmutable $referenceDate): CarbonImmutable
    {
        $roll = mt_rand(1, 100);

        if ($roll <= 5) {
            return $referenceDate->subDays(mt_rand(0, 6));
        }

        if ($roll <= 30) {
            return $windowStart->subMonths(mt_rand(1, 18))->subDays(mt_rand(0, 27));
        }

        $opening = $windowStart->addMonths(mt_rand(0, $this->windowMonths($windowStart, $referenceDate) - 1))->addDays(mt_rand(0, 27));

        return $opening > $referenceDate ? $referenceDate : $opening;
    }

    /**
     * Create the businesses, attach amenities, and return the created rows
     * with their specs for review generation. Timestamps are set explicitly:
     * created_at is the backdated opening, which the Go analytics date-range
     * filters read.
     *
     * @param  list<array<string, mixed>>  $specs
     * @param  Collection<string, Category>  $categories
     * @param  Collection<int, string>  $amenityIds
     * @param  list<User>  $owners
     * @return list<array{business: Business, spec: array<string, mixed>}>
     */
    private function createBusinesses(array $specs, $categories, $amenityIds, array $owners, CarbonImmutable $windowStart, CarbonImmutable $referenceDate): array
    {
        $created = [];

        foreach ($specs as $index => $spec) {
            $updated = $spec['opening']->addDays(mt_rand(0, 30));

            $business = new Business;
            $business->forceFill([
                'category_id' => $categories->get($spec['slug'])->id,
                'user_id' => $index % 20 === 19 ? null : $owners[$index % count($owners)]->id,
                'name' => $spec['name'],
                'description' => $spec['description'],
                'type' => $spec['type'],
                'address' => $spec['address'],
                'latitude' => $spec['latitude'],
                'longitude' => $spec['longitude'],
                'website' => $spec['website'],
                'phone' => $spec['phone'],
                'created_at' => $spec['opening']->toDateTimeString(),
                'updated_at' => ($updated > $referenceDate ? $referenceDate : $updated)->toDateTimeString(),
            ])->save();

            $business->amenities()->attach(
                $amenityIds->random(mt_rand(1, 8))->all(),
            );

            $created[] = ['business' => $business, 'spec' => $spec];
        }

        return $created;
    }

    /**
     * Build every review row for the created businesses. Activity tiers are
     * monthly rates (reviews per month), so volume accrues with time open:
     * new businesses naturally have few reviews and the current month never
     * spikes. Raw monthly expectations (rate x seasonality x growth trend x
     * jitter, with quiet gap months for low-tier businesses) are scaled by a
     * single global factor to hit the review target. Ratings correlate with
     * per-business quality, and no review ever predates its business's
     * opening or exceeds the reference date. All review text is synthetic.
     *
     * @param  list<array{business: Business, spec: array<string, mixed>}>  $created
     * @return list<array<string, mixed>>
     */
    private function reviewRows(array $created, int $reviewTarget, CarbonImmutable $referenceDate): array
    {
        $plans = [];
        $rawTotal = 0.0;

        foreach ($created as $entry) {
            $plan = $this->rawMonthlyPlan($entry['spec'], $referenceDate);
            $plans[] = $plan;
            $rawTotal += array_sum(array_column($plan, 'weight'));
        }

        $factor = $reviewTarget / max(1.0, $rawTotal);
        $rows = [];

        foreach ($created as $index => $entry) {
            $spec = $entry['spec'];

            foreach ($this->allocateCounts($plans[$index], $spec['tier'], $factor) as $bucket) {
                $monthStart = $bucket['month'];
                $daysInMonth = $monthStart->daysInMonth;

                for ($i = 0; $i < $bucket['count']; $i++) {
                    $day = mt_rand(1, $daysInMonth);

                    if ($monthStart->isSameMonth($spec['opening'])) {
                        $day = max($day, $spec['opening']->day);
                    }

                    if ($monthStart->isSameMonth($referenceDate)) {
                        $day = min($day, $referenceDate->day);
                    }

                    $date = $monthStart->addDays($day - 1);
                    $rating = $this->pickRating($spec['quality']);
                    [$title, $content] = $this->reviewText($spec['name'], $rating);
                    $stamp = $date->addHours(mt_rand(6, 21))->addMinutes(mt_rand(0, 59))->toDateTimeString();

                    $rows[] = [
                        'id' => (string) Str::uuid(),
                        'business_id' => $entry['business']->id,
                        'rating' => $rating,
                        'title' => $title,
                        'content' => $content,
                        'review_date' => $date->toDateString(),
                        'created_at' => $stamp,
                        'updated_at' => $stamp,
                    ];
                }
            }
        }

        return $rows;
    }

    /**
     * Raw expected reviews per active month for one business, from its
     * opening month through the reference month. The opening month is scaled
     * by the share of the month the business was actually open. Low-tier
     * businesses zero out ~45% of middle months (gap months) but always keep
     * their first and last, so quiet periods exist without any business going
     * silent at the bookends.
     *
     * @return list<array{month: CarbonImmutable, weight: float}>
     */
    private function rawMonthlyPlan(array $spec, CarbonImmutable $referenceDate): array
    {
        $rate = match ($spec['tier']) {
            'high' => mt_rand(14, 30),
            'medium' => mt_rand(4, 10),
            default => mt_rand(5, 25) / 10,
        };

        $monthBuckets = [];
        $cursor = $spec['opening']->startOfMonth();
        $last = $referenceDate->startOfMonth();

        while ($cursor <= $last) {
            $monthBuckets[] = $cursor;
            $cursor = $cursor->addMonth();
        }

        $total = count($monthBuckets);
        $plan = [];

        foreach ($monthBuckets as $i => $month) {
            $progress = $total === 1 ? 1.0 : $i / ($total - 1);
            $weight = $rate * self::SEASONALITY[(int) $month->format('n')] * (0.85 + 0.45 * $progress) * (mt_rand(70, 130) / 100);

            if ($i === 0) {
                $lastOpenDay = $month->isSameMonth($referenceDate) ? $referenceDate->day : $month->daysInMonth;
                $weight *= max(1, $lastOpenDay - $spec['opening']->day + 1) / $month->daysInMonth;
            }

            if ($spec['tier'] === 'low' && $total > 2 && $i > 0 && $i < $total - 1 && mt_rand(1, 100) <= 45) {
                $weight = 0.0;
            }

            $plan[] = ['month' => $month, 'weight' => $weight];
        }

        return $plan;
    }

    /**
     * Turn scaled monthly expectations into integer counts: floors plus a
     * largest-remainder distribution so each business's total matches its
     * scaled plan, with a minimum of one review per active month for
     * high/medium businesses.
     *
     * @param  list<array{month: CarbonImmutable, weight: float}>  $plan
     * @return list<array{month: CarbonImmutable, count: int}>
     */
    private function allocateCounts(array $plan, string $tier, float $factor): array
    {
        $counts = [];
        $fractions = [];

        foreach ($plan as $i => $bucket) {
            $value = $bucket['weight'] * $factor;
            $counts[$i] = (int) floor($value);
            $fractions[$i] = $value - $counts[$i];
        }

        $remainder = (int) round(array_sum(array_column($plan, 'weight')) * $factor) - array_sum($counts);
        arsort($fractions);

        foreach (array_keys($fractions) as $i) {
            if ($remainder <= 0) {
                break;
            }
            if ($plan[$i]['weight'] > 0) {
                $counts[$i]++;
                $remainder--;
            }
        }

        if ($tier !== 'low') {
            foreach ($plan as $i => $bucket) {
                if ($bucket['weight'] > 0 && $counts[$i] === 0) {
                    $donor = array_search(max($counts), $counts, true);
                    $counts[$donor]--;
                    $counts[$i] = 1;
                }
            }
        }

        $out = [];

        foreach ($plan as $i => $bucket) {
            $out[] = ['month' => $bucket['month'], 'count' => $counts[$i]];
        }

        return $out;
    }

    /**
     * Sample a rating from a Gaussian-shaped distribution around the
     * business's quality level (sigma 0.85), producing realistic spreads of
     * 1-5 integers that satisfy the reviews_rating_range_check constraint.
     */
    private function pickRating(float $quality): int
    {
        $weights = [];

        for ($rating = 1; $rating <= 5; $rating++) {
            $weights[$rating] = exp(-(($rating - $quality) ** 2) / (2 * 0.85 ** 2));
        }

        $roll = mt_rand(1, 1000000) / 1000000 * array_sum($weights);

        for ($rating = 1; $rating <= 5; $rating++) {
            $roll -= $weights[$rating];

            if ($roll <= 0) {
                return $rating;
            }
        }

        return 5;
    }

    /**
     * Synthetic review copy, banded by rating. All text is generic demo
     * content — never genuine customer information.
     *
     * @return array{0: string, 1: string}
     */
    private function reviewText(string $businessName, int $rating): array
    {
        $positive = [
            ['Amazing Caribbean spot', 'Loved every minute', 'Worth the trip down the coast', 'A Caribbean highlight', 'Better than we hoped', 'Exactly what we needed', 'True hospitality', 'Hidden gem', 'Coming back next season', 'Five stars is not enough'],
            [
                '{name} delivered. The staff treated us like family and the Caribbean pace is exactly what we came for.',
                'Weather, food, music — everything clicked. {name} is a keeper for our next trip to the coast.',
                'Snorkeling in the morning, hammock in the afternoon. Hard to argue with a day like that.',
                'We came for a weekend and extended our stay. The whole team went out of their way for us.',
                'Fresh food, kind people, and a short walk to the water. What else do you need?',
                'One of those places that restores your faith in travel. Quiet, warm, and genuine.',
                'The area came alive through their recommendations — we saw sloths, reef, and rainforest.',
                'Everything was easy from the first message to the last breakfast. Thank you!',
            ],
        ];

        $mixed = [
            ['Good, with caveats', 'Solid for the price', 'Mixed feelings', 'Fine but forgettable', 'Some ups and downs', 'Okay stay', 'Could be better', 'Average but charming'],
            [
                '{name} has real charm and the location is great, but service was slow on busy days.',
                'Perfectly fine for a night or two. Nothing fancy, nothing broken.',
                'The good: setting and price. The less good: consistency — great one day, mediocre the next.',
                'Friendly people and good food, though the rooms could use an update.',
                'We enjoyed parts of it, but our expectations were set a little higher by the photos.',
                'Fair value in low season. I would return, with patience packed in the suitcase.',
            ],
        ];

        $negative = [
            ['Not what we expected', 'Disappointing visit', 'Would not return', 'Needs work', 'Overpriced for what it is', 'Skip this one', 'Problems from check-in', 'Regretted booking'],
            [
                'Unfortunately {name} did not match the description. Staff seemed overwhelmed.',
                'The location deserved better. Maintenance issues were obvious from arrival.',
                'We cut our stay short. Fine for some travellers, but not for us.',
                'Poor communication before the visit and slow responses during it.',
                'There are better options nearby for the same price — keep looking.',
                'A shame, because the setting is beautiful. The operation let it down.',
            ],
        ];

        $band = $rating >= 4 ? $positive : ($rating === 3 ? $mixed : $negative);
        $title = $band[0][mt_rand(0, count($band[0]) - 1)];
        $content = $band[1][mt_rand(0, count($band[1]) - 1)];

        return [
            strtr($title, ['{name}' => $businessName]),
            strtr($content, ['{name}' => $businessName]),
        ];
    }

    /**
     * Deterministic fictional name from Caribbean-flavoured word pools,
     * unique against the provided used-names set.
     */
    private function fictionalName(string $slug): string
    {
        $prefixes = match ($slug) {
            'hotels' => ['Hotel', 'Hostel', 'Cabinas', 'Eco-Lodge', 'Lodge', 'Posada', 'Guest House'],
            'restaurants' => ['Soda', 'Restaurante', 'Cafe', 'Bakery', 'Comedor', 'Trattoria', 'Beach Bar'],
            default => ['Tours', 'Aventuras', 'Expediciones', 'Kayak Tours', 'Surf School', 'Wildlife Tours', 'Boat Tours', 'Reef Tours'],
        };

        $words = ['Caribe', 'Playa', 'Selva', 'Mangle', 'Coral', 'Palma', 'Olas', 'Estrella', 'Luna', 'Sol', 'Tortuga', 'Cacao', 'Ceiba', 'Almendro', 'Brisas', 'Bahia', 'Rio', 'Playita'];
        $suffixes = ['Azul', 'Verde', 'Dorado', 'Tranquilo', 'Encantado', 'Bonito', 'Escondido', 'Perdido', 'del Mar', 'de la Selva', 'Caribeno', 'Tropical', 'Soleado', 'Serena'];
        $places = ['Playa Negra', 'Salsa Brava', 'Cahuita', 'Manzanillo', 'Punta Uva', 'Cocles', 'Talamanca', 'Caribe', 'Reef', 'Jungle', 'Bribri', 'Mango'];

        if ($slug === 'tours') {
            return sprintf('%s %s', $places[mt_rand(0, count($places) - 1)], $prefixes[mt_rand(0, count($prefixes) - 1)]);
        }

        return sprintf(
            '%s %s %s',
            $prefixes[mt_rand(0, count($prefixes) - 1)],
            $words[mt_rand(0, count($words) - 1)],
            $suffixes[mt_rand(0, count($suffixes) - 1)],
        );
    }

    /**
     * A plausible type string for a fictional business of the given category.
     */
    private function typeFor(string $slug, string $name): string
    {
        return match ($slug) {
            'hotels' => ['Boutique hotel', 'Hostel', 'Cabinas', 'Eco-lodge', 'Guest house', 'Beach lodge'][preg_match('/^Hostel/', $name) ? 1 : mt_rand(0, 5)],
            'restaurants' => ['Soda', 'Seafood restaurant', 'Cafe', 'Beach bar', 'Caribbean restaurant', 'Pizzeria'][mt_rand(0, 5)],
            default => ['Snorkeling tour', 'Wildlife tour', 'Kayak tour', 'Surf school', 'Guided hike', 'Reef tour'][mt_rand(0, 5)],
        };
    }

    /**
     * Weighted town pick for fictional businesses.
     */
    private function pickTown(): string
    {
        $roll = mt_rand(1, 100);
        $cumulative = 0;

        foreach (self::TOWNS as $key => $town) {
            $cumulative += $town['weight'];

            if ($roll <= $cumulative) {
                return $key;
            }
        }

        return 'puerto_viejo';
    }

    /**
     * Synthetic description for a fictional business, clearly marked as a
     * demo record.
     */
    private function fictionalDescription(string $slug, string $name, string $town): string
    {
        $body = match ($slug) {
            'hotels' => sprintf(
                '%s is a relaxed place to sleep in %s, a short walk from the beach and the rainforest trailheads. '
                .'Mornings start with birdsong and strong coffee; evenings with the sound of the Caribbean. '
                .'(Synthetic demo record.)',
                $name,
                $town,
            ),
            'restaurants' => sprintf(
                '%s serves Caribbean classics in %s — rice and beans in coconut milk, fried plantains, and the '
                .'fresh catch of the day, a few steps from the water. (Synthetic demo record.)',
                $name,
                $town,
            ),
            default => sprintf(
                '%s runs small-group trips out of %s to the coral reef, the rainforest trails, and the '
                .'Gandoca-Manzanillo refuge. (Synthetic demo record.)',
                $name,
                $town,
            ),
        };

        return $body;
    }

    /**
     * Months between window start and reference date, inclusive.
     */
    private function windowMonths(CarbonImmutable $windowStart, CarbonImmutable $referenceDate): int
    {
        return (int) $windowStart->diffInMonths($referenceDate) + 1;
    }
}
