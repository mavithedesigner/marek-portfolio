/**
 * The question above the "one more project" card at the end of a case study.
 *
 * It changes with every project someone opens in a row, so clicking through
 * feels like a conversation instead of the same button again. Opening any page
 * that isn't a project starts the count over. After the tenth it stops
 * pretending and counts with you.
 */
export const ONE_MORE_LINES = [
	"Got a minute for one more project? :)",
	"Maybe one more? :)",
	"Okay, you're on a roll. Another one? :)",
	"Still here? I like you already :)",
	"Five down. Curious what's next? :)",
	"At this point you know my work better than my LinkedIn does :)",
	"Seven already? You clearly have good taste :)",
	"You've basically seen the whole archive. Almost. One more? :)",
	"Nine. I'm starting to feel a little shy :)",
	"Ten projects! You've earned a gold star. Keep going? :)",
];

/** From the eleventh project on: the count, and a nudge to the Contact button below. */
export function crazyLine(count: number) {
	return `Project number ${count}. Okay, let's just talk. The Contact button is right below :D`;
}

const KEY = "one-more-streak";

function read() {
	try {
		return Number(sessionStorage.getItem(KEY)) || 0;
	} catch {
		return 0;
	}
}

function write(value: number) {
	try {
		if (value === 0) sessionStorage.removeItem(KEY);
		else sessionStorage.setItem(KEY, String(value));
	} catch {
		// Storage can be blocked (private mode); the first line just stays.
	}
}

/** Runs on every page load: counts project pages in a row, resets on others. */
export function updateOneMore() {
	const heading = document.getElementById("one-more-heading");
	if (!heading) {
		write(0);
		return;
	}

	const count = read() + 1;
	write(count);

	const crazy = count > ONE_MORE_LINES.length;
	heading.textContent = crazy ? crazyLine(count) : ONE_MORE_LINES[count - 1];
	heading.classList.toggle("one-more--crazy", crazy);
}
