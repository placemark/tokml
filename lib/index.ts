import type { Folder, Root } from "@tmcw/togeojson";
import type { Feature, FeatureCollection, Geometry, Position } from "geojson";
import { u } from "unist-builder";
import type { Element, Node } from "xast";
import { toXml } from "xast-util-to-xml";
import { x } from "xastscript";

type F = Feature<Geometry | null>;

const BR = u("text", "\n");
const TAB = u("text", "  ");

// Logging configuration
export interface LoggerConfig {
	enabled: boolean;
	level: "debug" | "info" | "warn" | "error";
}

let loggerConfig: LoggerConfig = {
	enabled: false,
	level: "info",
};

const log = {
	debug: (message: string, ...args: any[]) => {
		if (loggerConfig.enabled && shouldLog("debug")) {
			console.debug(`[tokml:debug] ${message}`, ...args);
		}
	},
	info: (message: string, ...args: any[]) => {
		if (loggerConfig.enabled && shouldLog("info")) {
			console.info(`[tokml:info] ${message}`, ...args);
		}
	},
	warn: (message: string, ...args: any[]) => {
		if (loggerConfig.enabled && shouldLog("warn")) {
			console.warn(`[tokml:warn] ${message}`, ...args);
		}
	},
	error: (message: string, ...args: any[]) => {
		if (loggerConfig.enabled && shouldLog("error")) {
			console.error(`[tokml:error] ${message}`, ...args);
		}
	},
};

function shouldLog(level: "debug" | "info" | "warn" | "error"): boolean {
	const levels = ["debug", "info", "warn", "error"];
	return levels.indexOf(level) >= levels.indexOf(loggerConfig.level);
}

/**
 * Configure logging for the tokml library
 * @param config - Logger configuration
 */
export function setLoggerConfig(config: Partial<LoggerConfig>): void {
	loggerConfig = { ...loggerConfig, ...config };
	log.info("Logger configuration updated", loggerConfig);
}

type Literal = typeof BR;

/**
 * Convert nested folder structure to KML. This expects
 * input that follows the same patterns as [toGeoJSON](https://github.com/placemark/togeojson)'s
 * kmlWithFolders method: a tree of folders and features,
 * starting with a root element.
 */
export function foldersToKML(root: Root): string {
	log.info("Starting foldersToKML conversion", {
		childrenCount: root.children.length,
	});

	const styles: Element[] = [];
	const featureIndex = { value: 0 };

	const children = root.children.flatMap((child) => {
		return convertChild(child, styles, featureIndex);
	});

	log.info("Conversion completed", {
		stylesGenerated: styles.length,
		featuresProcessed: featureIndex.value,
		totalChildren: children.length,
	});

	return toXml(
		u("root", {
			children: [
				x(
					"kml",
					{ xmlns: "http://www.opengis.net/kml/2.2" },
					// @ts-ignore - TypeScript has trouble with mixed array types but this works correctly
					x("Document", [...styles, ...children.flat()]),
				),
			],
		}),
	);
}

/**
 * Convert a GeoJSON FeatureCollection to a string of
 * KML data.
 */
export function toKML(
	featureCollection: FeatureCollection<Geometry | null>,
): string {
	log.info("Starting toKML conversion", {
		featuresCount: featureCollection.features.length,
	});

	const styles: Element[] = [];
	const features = featureCollection.features.map((feature, index) => {
		const style = createStyleFromFeature(feature, index);
		if (style) {
			styles.push(style);
			log.debug("Created style for feature", {
				index,
				color: feature.properties?.color,
			});
		}
		return convertFeature(feature, index);
	});

	log.info("Conversion completed", {
		stylesGenerated: styles.length,
		featuresProcessed: features.length,
	});

	return toXml(
		u("root", {
			children: [
				x(
					"kml",
					{ xmlns: "http://www.opengis.net/kml/2.2" },
					// @ts-ignore - TypeScript has trouble with mixed array types but this works correctly
					x("Document", [...styles, ...features.flat()]),
				),
			],
		}),
	);
}

function convertChild(
	child: F | Folder,
	styles?: Element[],
	featureIndex?: { value: number },
): Array<Literal | Element> {
	switch (child.type) {
		case "Feature": {
			const index = featureIndex?.value ?? 0;
			if (featureIndex) featureIndex.value++;
			const style = createStyleFromFeature(child, index);
			if (style && styles) {
				styles.push(style);
			}
			return convertFeature(child, index);
		}
		case "folder":
			return convertFolder(child, styles, featureIndex);
	}
}

function convertFolder(
	folder: Folder,
	styles?: Element[],
	featureIndex?: { value: number },
): Array<Literal | Element> {
	const id = ["string", "number"].includes(typeof folder.meta.id)
		? {
				id: String(folder.meta.id),
			}
		: {};
	return [
		BR,
		x("Folder", id, [
			BR,
			...folderMeta(folder.meta),
			BR,
			TAB,
			...folder.children.flatMap((child) =>
				convertChild(child, styles, featureIndex),
			),
		]),
	];
}

const META_PROPERTIES = [
	"address",
	"description",
	"name",
	"open",
	"visibility",
	"phoneNumber",
] as const;

function folderMeta(meta: Folder["meta"]): Element[] {
	return META_PROPERTIES.filter((p) => meta[p] !== undefined).map((p) => {
		return x(p, [u("text", String(meta[p]))]);
	});
}

function createStyleFromFeature(feature: F, index: number): Element | null {
	if (!feature.properties?.color) {
		log.debug("No color property found for feature", { index });
		return null;
	}

	const color = feature.properties.color;

	// Validate hex color format
	if (
		typeof color !== "string" ||
		!color.startsWith("#") ||
		color.length !== 7
	) {
		log.warn("Invalid color format detected", {
			index,
			color,
			expected: "#RRGGBB",
		});
	}

	// Convert hex color to KML format (AABBGGRR)
	const kmlColor = `ff${color.slice(1)}`;
	const kmlFillColor = `ff${color.slice(1)}`;

	log.debug("Converting color to KML format", {
		index,
		originalColor: color,
		kmlColor,
		styleId: `style_${index}`,
	});

	return x("Style", { id: `style_${index}` }, [
		BR,
		TAB,
		x("LineStyle", [BR, TAB, TAB, x("color", [u("text", kmlColor)]), BR, TAB]),
		BR,
		TAB,
		x("PolyStyle", [
			BR,
			TAB,
			TAB,
			x("color", [u("text", kmlFillColor)]),
			BR,
			TAB,
		]),
		BR,
	]);
}

function convertFeature(feature: F, index?: number) {
	log.debug("Converting feature", {
		index,
		featureId: feature.id,
		geometryType: feature.geometry?.type,
		hasColor: !!feature.properties?.color,
	});

	const { id } = feature;
	const idMember = ["string", "number"].includes(typeof id)
		? {
				id: id,
			}
		: {};

	const styleElements = [];
	if (feature.properties?.color && typeof index === "number") {
		styleElements.push(BR, TAB, x("styleUrl", [u("text", `#style_${index}`)]));
		log.debug("Added style reference to feature", {
			index,
			styleId: `style_${index}`,
		});
	}

	return [
		BR,
		x("Placemark", idMember, [
			BR,
			...propertiesToTags(feature.properties),
			...styleElements,
			BR,
			TAB,
			...(feature.geometry ? [convertGeometry(feature.geometry)] : []),
		]),
	];
}

function join(position: Position): string {
	return `${position[0]},${position[1]}`;
}

function coord1(coordinates: Position): Element {
	return x("coordinates", [u("text", join(coordinates))]);
}

function coord2(coordinates: Position[]): Element {
	return x("coordinates", [u("text", coordinates.map(join).join("\n"))]);
}

function valueToString(value: any): string {
	switch (typeof value) {
		case "string": {
			return value;
		}
		case "boolean":
		case "number": {
			return String(value);
		}
		case "object": {
			try {
				return JSON.stringify(value);
			} catch (e) {
				return "";
			}
		}
	}
	return "";
}

function maybeCData(value: any) {
	if (
		value &&
		typeof value === "object" &&
		"@type" in value &&
		value["@type"] === "html" &&
		"value" in value &&
		typeof value.value === "string"
	) {
		return u("cdata", value.value);
	}

	return valueToString(value);
}

function propertiesToTags(properties: Feature["properties"]): Element[] {
	if (!properties) return [];
	const { name, description, visibility, ...otherProperties } = properties;

	return [
		name && x("name", [u("text", valueToString(name))]),
		description && x("description", [u("text", maybeCData(description))]),
		visibility !== undefined &&
			x("visibility", [u("text", visibility ? "1" : "0")]),
		x(
			"ExtendedData",
			Object.entries(otherProperties).flatMap(([name, value]) => [
				BR,
				TAB,
				x("Data", { name: name }, [
					x("value", [
						u(
							"text",
							typeof value === "string" ? value : JSON.stringify(value),
						),
					]),
				]),
			]),
		),
	].filter(Boolean);
}

const linearRing = (ring: Position[]): Element =>
	x("LinearRing", [coord2(ring)]);

function convertMultiPoint(geometry: GeoJSON.MultiPoint): Element {
	return x(
		"MultiGeometry",
		geometry.coordinates.flatMap((coordinates) => [
			BR,
			convertGeometry({
				type: "Point",
				coordinates,
			}),
		]),
	);
}
function convertMultiLineString(geometry: GeoJSON.MultiLineString): Element {
	return x(
		"MultiGeometry",
		geometry.coordinates.flatMap((coordinates) => [
			BR,
			convertGeometry({
				type: "LineString",
				coordinates,
			}),
		]),
	);
}

function convertMultiPolygon(geometry: GeoJSON.MultiPolygon): Element {
	return x(
		"MultiGeometry",
		geometry.coordinates.flatMap((coordinates) => [
			BR,
			convertGeometry({
				type: "Polygon",
				coordinates,
			}),
		]),
	);
}

function convertPolygon(geometry: GeoJSON.Polygon): Element {
	const [outerBoundary, ...innerRings] = geometry.coordinates;
	return x("Polygon", [
		BR,
		x("outerBoundaryIs", [BR, TAB, linearRing(outerBoundary)]),
		...innerRings.flatMap((innerRing) => [
			BR,
			x("innerBoundaryIs", [BR, TAB, linearRing(innerRing)]),
		]),
	]);
}

function convertGeometry(geometry: Geometry): Element {
	switch (geometry.type) {
		case "Point":
			return x("Point", [coord1(geometry.coordinates)]);
		case "MultiPoint":
			return convertMultiPoint(geometry);
		case "LineString":
			return x("LineString", [coord2(geometry.coordinates)]);
		case "MultiLineString":
			return convertMultiLineString(geometry);
		case "Polygon":
			return convertPolygon(geometry);
		case "MultiPolygon":
			return convertMultiPolygon(geometry);
		case "GeometryCollection":
			return x(
				"MultiGeometry",
				geometry.geometries.flatMap((geometry) => [
					BR,
					convertGeometry(geometry),
				]),
			);
	}
}
