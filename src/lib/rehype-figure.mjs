/**
 * An image alone in its paragraph, with a title, becomes a figure with that
 * title underneath, the same small caption the project galleries show:
 *
 *   ![What the image shows](../../assets/thoughts/x.png "x.png")
 *
 * The alt text stays for screen readers; the title is what people see.
 * @returns {(tree: any) => void}
 */
export default function rehypeFigure() {
	/** @param {any} node */
	const walk = (node) => {
		if (!node.children) return;
		node.children.forEach((/** @type {any} */ child, /** @type {number} */ i) => {
			if (child.type === "element" && child.tagName === "p") {
				const kids = child.children.filter(
					(/** @type {any} */ k) => !(k.type === "text" && !k.value.trim()),
				);
				const img = kids[0];
				if (kids.length === 1 && img.tagName === "img" && img.properties?.title) {
					const caption = String(img.properties.title);
					delete img.properties.title;
					node.children[i] = {
						type: "element",
						tagName: "figure",
						properties: {},
						children: [
							img,
							{
								type: "element",
								tagName: "figcaption",
								properties: {},
								children: [{ type: "text", value: caption }],
							},
						],
					};
					return;
				}
			}
			walk(child);
		});
	};
	return walk;
}
