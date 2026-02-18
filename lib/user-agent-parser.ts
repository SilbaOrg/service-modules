type ParsedUserAgent = {
  browserName: string;
  browserVersion: string;
  osName: string;
  osVersion: string;
};

function extractVersion(userAgent: string, token: string): string {
  const tokenIndex = userAgent.indexOf(token);

  if (tokenIndex === -1) {
    return "unknown";
  }

  const versionStart = tokenIndex + token.length;
  const remaining = userAgent.substring(versionStart);
  const match = remaining.match(/^[\d.]+/);

  if (match === null) {
    return "unknown";
  }

  return match[0];
}

function parseBrowser(userAgent: string): { name: string; version: string } {
  if (userAgent.includes("Edg/")) {
    return { name: "Edge", version: extractVersion(userAgent, "Edg/") };
  }

  if (userAgent.includes("EdgA/")) {
    return { name: "Edge", version: extractVersion(userAgent, "EdgA/") };
  }

  if (userAgent.includes("EdgiOS/")) {
    return { name: "Edge", version: extractVersion(userAgent, "EdgiOS/") };
  }

  if (userAgent.includes("OPR/")) {
    return { name: "Opera", version: extractVersion(userAgent, "OPR/") };
  }

  if (userAgent.includes("Opera/")) {
    return { name: "Opera", version: extractVersion(userAgent, "Opera/") };
  }

  if (userAgent.includes("SamsungBrowser/")) {
    return { name: "Samsung Internet", version: extractVersion(userAgent, "SamsungBrowser/") };
  }

  if (userAgent.includes("CriOS/")) {
    return { name: "Chrome", version: extractVersion(userAgent, "CriOS/") };
  }

  if (userAgent.includes("FxiOS/")) {
    return { name: "Firefox", version: extractVersion(userAgent, "FxiOS/") };
  }

  if (userAgent.includes("Firefox/")) {
    return { name: "Firefox", version: extractVersion(userAgent, "Firefox/") };
  }

  if (userAgent.includes("Chrome/")) {
    return { name: "Chrome", version: extractVersion(userAgent, "Chrome/") };
  }

  if (userAgent.includes("Version/") && userAgent.includes("Safari/")) {
    return { name: "Safari", version: extractVersion(userAgent, "Version/") };
  }

  if (userAgent.includes("Safari/")) {
    return { name: "Safari", version: extractVersion(userAgent, "Safari/") };
  }

  if (userAgent.includes("MSIE ")) {
    return { name: "Internet Explorer", version: extractVersion(userAgent, "MSIE ") };
  }

  if (userAgent.includes("Trident/")) {
    const rvMatch = userAgent.match(/rv:(\d+\.?\d*)/);
    const ieVersion = rvMatch !== null ? rvMatch[1] : "unknown";
    return { name: "Internet Explorer", version: ieVersion };
  }

  return { name: "unknown", version: "unknown" };
}

function parseOperatingSystem(userAgent: string): { name: string; version: string } {
  if (userAgent.includes("CrOS")) {
    const match = userAgent.match(/CrOS\s+\S+\s+([\d.]+)/);
    const chromiumOsVersion = match !== null ? match[1] : "unknown";
    return { name: "Chrome OS", version: chromiumOsVersion };
  }

  if (userAgent.includes("iPhone") || userAgent.includes("iPad") || userAgent.includes("iPod")) {
    const match = userAgent.match(/OS ([\d_]+)/);

    if (match !== null) {
      const iosVersion = match[1].replace(/_/g, ".");
      return { name: "iOS", version: iosVersion };
    }

    return { name: "iOS", version: "unknown" };
  }

  if (userAgent.includes("Android")) {
    return { name: "Android", version: extractVersion(userAgent, "Android ") };
  }

  if (userAgent.includes("Windows NT")) {
    return { name: "Windows", version: extractVersion(userAgent, "Windows NT ") };
  }

  if (userAgent.includes("Mac OS X")) {
    const match = userAgent.match(/Mac OS X ([\d_.]+)/);

    if (match !== null) {
      const macOsVersion = match[1].replace(/_/g, ".");
      return { name: "macOS", version: macOsVersion };
    }

    return { name: "macOS", version: "unknown" };
  }

  if (userAgent.includes("Macintosh")) {
    return { name: "macOS", version: "unknown" };
  }

  if (userAgent.includes("Linux")) {
    return { name: "Linux", version: "unknown" };
  }

  return { name: "unknown", version: "unknown" };
}

export function parseUserAgent(userAgent: string): ParsedUserAgent {
  const browser = parseBrowser(userAgent);
  const operatingSystem = parseOperatingSystem(userAgent);

  return {
    browserName: browser.name,
    browserVersion: browser.version,
    osName: operatingSystem.name,
    osVersion: operatingSystem.version,
  };
}
