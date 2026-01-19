/**
 * Fun equivalencies for stats to make numbers more tangible and delightful.
 */

/**
 * Get fun equivalencies for money saved.
 * @param {number} amount - Dollar amount saved
 * @returns {Array<{emoji: string, text: string}>}
 */
export const getMoneyEquivalencies = (amount) => {
    const equivalencies = [];

    // Lattes (~$5 each)
    const lattes = Math.floor(amount / 5);
    if (lattes >= 1) {
        equivalencies.push({
            emoji: '☕',
            text: lattes === 1 ? "That's 1 latte" : `That's ${lattes} lattes`,
        });
    }

    // Netflix months (~$15/month)
    const netflixMonths = Math.floor(amount / 15);
    if (netflixMonths >= 1) {
        equivalencies.push({
            emoji: '📺',
            text: netflixMonths === 1
                ? '1 month of Netflix'
                : `${netflixMonths} months of Netflix`,
        });
    }

    // Dinner thresholds
    if (amount >= 100) {
        equivalencies.push({
            emoji: '🍽️',
            text: 'A fancy dinner for two',
        });
    } else if (amount >= 50) {
        equivalencies.push({
            emoji: '🍽️',
            text: 'A nice dinner out',
        });
    }

    // Concert/event ticket
    if (amount >= 75) {
        equivalencies.push({
            emoji: '🎵',
            text: 'A concert ticket',
        });
    }

    // Weekend trip savings
    if (amount >= 200) {
        equivalencies.push({
            emoji: '✈️',
            text: 'Getting closer to a weekend trip!',
        });
    }

    // Fallback for small amounts
    if (equivalencies.length === 0 && amount > 0) {
        equivalencies.push({
            emoji: '💰',
            text: 'Every dollar counts!',
        });
    }

    return equivalencies;
};

/**
 * Get fun equivalencies for calories cut.
 * @param {number} calories - Number of calories cut
 * @returns {Array<{emoji: string, text: string}>}
 */
export const getCaloriesEquivalencies = (calories) => {
    const equivalencies = [];

    // Running (~100 cal/mile)
    const miles = Math.round(calories / 100);
    if (miles >= 1) {
        equivalencies.push({
            emoji: '🏃',
            text: miles === 1 ? 'Running 1 mile' : `Running ${miles} miles`,
        });
    }

    // Burgers (~300 cal each)
    const burgers = Math.floor(calories / 300);
    if (burgers >= 1) {
        equivalencies.push({
            emoji: '🍔',
            text: burgers === 1
                ? '1 burger you didn\'t eat'
                : `${burgers} burgers you didn't eat`,
        });
    }

    // Swimming (~500 cal/hour)
    const swimmingHours = (calories / 500).toFixed(1);
    if (parseFloat(swimmingHours) >= 0.5) {
        equivalencies.push({
            emoji: '🏊',
            text: `Swimming for ${swimmingHours} hours`,
        });
    }

    // Pizza slices (~285 cal each)
    const pizzaSlices = Math.floor(calories / 285);
    if (pizzaSlices >= 2) {
        equivalencies.push({
            emoji: '🍕',
            text: `${pizzaSlices} pizza slices worth`,
        });
    }

    // Donuts (~250 cal each)
    const donuts = Math.floor(calories / 250);
    if (donuts >= 1) {
        equivalencies.push({
            emoji: '🍩',
            text: donuts === 1 ? '1 donut' : `${donuts} donuts`,
        });
    }

    // Fallback for small amounts
    if (equivalencies.length === 0 && calories > 0) {
        equivalencies.push({
            emoji: '✨',
            text: 'Every calorie counts!',
        });
    }

    return equivalencies;
};

/**
 * Get encouraging message based on streak length.
 * @param {number} days - Number of days in streak
 * @returns {{emoji: string, text: string, showConfetti: boolean}}
 */
export const getStreakMessage = (days) => {
    if (days === 0) {
        return { emoji: '💪', text: 'Start your streak today!', showConfetti: false };
    }
    if (days === 1) {
        return { emoji: '🌱', text: 'Day 1 - The journey begins!', showConfetti: true };
    }
    if (days <= 3) {
        return { emoji: '🔥', text: 'Building momentum!', showConfetti: true };
    }
    if (days <= 7) {
        return { emoji: '⭐', text: 'One week strong! Amazing!', showConfetti: true };
    }
    if (days <= 14) {
        return { emoji: '🏆', text: 'Two weeks! You\'re unstoppable!', showConfetti: true };
    }
    if (days <= 30) {
        return { emoji: '👑', text: 'A whole month! Incredible!', showConfetti: true };
    }
    if (days <= 60) {
        return { emoji: '🎯', text: 'Two months! You\'re a champion!', showConfetti: true };
    }
    if (days <= 90) {
        return { emoji: '💎', text: 'Three months! Diamond status!', showConfetti: true };
    }
    return { emoji: '🎉', text: `${days} days! You're a legend!`, showConfetti: true };
};

/**
 * Get a random equivalency from a list.
 * @param {Array<{emoji: string, text: string}>} equivalencies
 * @returns {{emoji: string, text: string} | null}
 */
export const getRandomEquivalency = (equivalencies) => {
    if (!equivalencies || equivalencies.length === 0) return null;
    return equivalencies[Math.floor(Math.random() * equivalencies.length)];
};
