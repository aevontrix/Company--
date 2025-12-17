/**
 * ARCHITECT ZERO - Fresnel Shader for 3D Crystalline Data Artifacts
 *
 * Protocol: Rim Light Simulation (CSS/WebGL)
 * Application: Profile Data Artifacts, Knowledge Graph Nodes
 *
 * Mathematical Model:
 * Fresnel(θ) = F₀ + (1 - F₀) × (1 - cos(θ))^power
 * where θ = angle between view direction and surface normal
 *
 * Optimized for:
 * - Real-time browser rendering
 * - CSS 3D transforms fallback
 * - WebGL fragment shader acceleration
 */

#ifdef GL_ES
precision mediump float;
#endif

// Uniforms
uniform vec2 u_resolution;       // Viewport resolution
uniform vec2 u_mouse;            // Mouse position (normalized 0-1)
uniform float u_time;            // Animation time
uniform vec3 u_objectColor;      // Base artifact color
uniform float u_fresnelPower;    // Rim intensity (default: 2.0)
uniform float u_fresnelBias;     // Base reflectivity (default: 0.1)
uniform float u_glowIntensity;   // Outer glow strength (0-1)

// Varyings
varying vec2 v_uv;               // Texture coordinates
varying vec3 v_normal;           // Surface normal (world space)
varying vec3 v_viewDir;          // View direction (world space)
varying vec3 v_position;         // Fragment position (world space)

/**
 * Fresnel Effect Calculation
 *
 * Simulates light reflection at grazing angles
 * Used for rim lighting on crystalline artifacts
 *
 * @param viewDir - Normalized view direction
 * @param normal - Normalized surface normal
 * @param power - Sharpness of rim (1.0 = soft, 5.0 = sharp)
 * @param bias - Base reflection (0.0 = none, 1.0 = full)
 * @return Fresnel intensity (0-1)
 */
float calculateFresnel(vec3 viewDir, vec3 normal, float power, float bias) {
    // Dot product: cos(angle between view and normal)
    float facing = dot(normalize(viewDir), normalize(normal));

    // Clamp to avoid negative values
    facing = clamp(facing, 0.0, 1.0);

    // Schlick's approximation
    float fresnel = bias + (1.0 - bias) * pow(1.0 - facing, power);

    return fresnel;
}

/**
 * Crystalline Facet Simulation
 *
 * Creates angular light reflections for geometric shapes
 * Simulates multiple facet planes with varying normals
 *
 * @param position - Fragment world position
 * @param normal - Base surface normal
 * @return Facet intensity (0-1)
 */
float calculateCrystallineFacets(vec3 position, vec3 normal) {
    // Generate facet planes using trigonometric functions
    float facet1 = abs(sin(position.x * 5.0 + position.y * 3.0));
    float facet2 = abs(cos(position.y * 4.0 + position.z * 2.0));
    float facet3 = abs(sin(position.z * 3.0 + position.x * 4.0));

    // Combine facets with sharp thresholding
    float facets = max(max(facet1, facet2), facet3);
    facets = smoothstep(0.7, 0.9, facets); // Sharp edges

    return facets * 0.3; // Subtle overlay
}

/**
 * Inner Glow (Subsurface Scattering Approximation)
 *
 * Simulates light passing through semi-transparent material
 * Creates soft inner illumination
 *
 * @param viewDir - View direction
 * @param normal - Surface normal
 * @param color - Object color
 * @return Glow contribution (RGB)
 */
vec3 calculateInnerGlow(vec3 viewDir, vec3 normal, vec3 color) {
    // Inverse fresnel for subsurface effect
    float facing = dot(normalize(viewDir), normalize(normal));
    facing = clamp(facing, 0.0, 1.0);

    // Inner glow peaks at direct viewing angle
    float innerGlow = pow(facing, 0.5) * 0.4;

    return color * innerGlow;
}

/**
 * Outer Glow (Emission)
 *
 * Creates visible aura around artifact edges
 * Distance-based falloff with color tint
 *
 * @param uv - UV coordinates (0-1)
 * @param centerDist - Distance from center
 * @return Glow intensity (0-1)
 */
float calculateOuterGlow(vec2 uv, float centerDist) {
    // Radial gradient from center
    float glow = 1.0 - smoothstep(0.3, 1.0, centerDist);

    // Pulse animation
    glow *= (0.8 + 0.2 * sin(u_time * 2.0));

    return glow * u_glowIntensity;
}

/**
 * Edge Detection
 *
 * Highlights artifact boundaries with sharp lines
 * Used for holographic outline effect
 *
 * @param normal - Surface normal
 * @param viewDir - View direction
 * @return Edge intensity (0-1)
 */
float detectEdges(vec3 normal, vec3 viewDir) {
    float edge = 1.0 - abs(dot(normalize(normal), normalize(viewDir)));
    edge = smoothstep(0.7, 1.0, edge); // Sharp threshold
    return edge;
}

/**
 * Main Fragment Shader
 */
void main() {
    // Normalize vectors
    vec3 normal = normalize(v_normal);
    vec3 viewDir = normalize(v_viewDir);

    // Calculate center distance for radial effects
    vec2 center = vec2(0.5, 0.5);
    float centerDist = distance(v_uv, center);

    // === Fresnel Rim Light ===
    float fresnel = calculateFresnel(viewDir, normal, u_fresnelPower, u_fresnelBias);
    vec3 rimColor = u_objectColor * fresnel * 2.0; // Boosted intensity

    // === Crystalline Facets ===
    float facets = calculateCrystallineFacets(v_position, normal);
    vec3 facetColor = vec3(1.0) * facets;

    // === Inner Glow (Subsurface) ===
    vec3 innerGlow = calculateInnerGlow(viewDir, normal, u_objectColor);

    // === Outer Glow (Emission) ===
    float outerGlow = calculateOuterGlow(v_uv, centerDist);
    vec3 glowColor = u_objectColor * outerGlow;

    // === Edge Highlight ===
    float edge = detectEdges(normal, viewDir);
    vec3 edgeColor = vec3(1.0) * edge * 0.5;

    // === Combine All Layers ===
    vec3 finalColor = vec3(0.0);

    // Base color (muted)
    finalColor += u_objectColor * 0.3;

    // Add fresnel rim
    finalColor += rimColor;

    // Add crystalline facets
    finalColor += facetColor;

    // Add inner glow
    finalColor += innerGlow;

    // Add outer glow
    finalColor += glowColor;

    // Add edge highlight
    finalColor += edgeColor;

    // === Final Output ===
    // Alpha based on overall luminance
    float alpha = clamp(length(finalColor) * 0.5, 0.1, 1.0);

    gl_FragColor = vec4(finalColor, alpha);
}

/**
 * ============================================
 * CSS 3D TRANSFORM FALLBACK (NO WEBGL)
 * ============================================
 *
 * For browsers without WebGL support, use CSS approximation:
 *
 * Fresnel Rim (Radial Gradient):
 * background: radial-gradient(
 *   circle at 50% 50%,
 *   transparent 40%,
 *   rgba(color, 0.3) 70%,
 *   rgba(color, 0.6) 100%
 * );
 *
 * Dynamic positioning based on mouse:
 * background-position: calc(50% + mouseY * 10%) calc(50% + mouseX * 10%)
 *
 * Crystalline Facets (Linear Gradients):
 * background:
 *   linear-gradient(120deg, transparent 40%, rgba(color, 0.2) 50%, transparent 60%),
 *   linear-gradient(240deg, transparent 40%, rgba(color, 0.2) 50%, transparent 60%);
 *
 * 3D Transform (Perspective):
 * transform: perspective(1000px)
 *            rotateX(mouseY * 20deg)
 *            rotateY(mouseX * 20deg)
 *            translateZ(20px);
 * transform-style: preserve-3d;
 *
 * Outer Glow (Box Shadow):
 * box-shadow:
 *   0 0 40px rgba(color, 0.6),
 *   0 0 80px rgba(color, 0.3),
 *   0 0 10px rgba(color, 0.2) inset;
 *
 * Animation (Keyframes):
 * @keyframes fresnel-pulse {
 *   0%, 100% { opacity: 0.8; }
 *   50% { opacity: 1.0; }
 * }
 * animation: fresnel-pulse 2s ease-in-out infinite;
 */

/**
 * ============================================
 * METAL SHADING LANGUAGE (iOS/macOS)
 * ============================================
 *
 * For native applications, use Metal shader:
 *
 * struct FragmentIn {
 *     float4 position [[position]];
 *     float3 normal;
 *     float3 viewDir;
 *     float2 uv;
 * };
 *
 * fragment float4 fresnelFragment(
 *     FragmentIn in [[stage_in]],
 *     constant float3& objectColor [[buffer(0)]],
 *     constant float& fresnelPower [[buffer(1)]],
 *     constant float& time [[buffer(2)]]
 * ) {
 *     float3 normal = normalize(in.normal);
 *     float3 viewDir = normalize(in.viewDir);
 *
 *     float facing = dot(viewDir, normal);
 *     float fresnel = pow(1.0 - facing, fresnelPower);
 *
 *     float3 rimColor = objectColor * fresnel * 2.0;
 *     float3 baseColor = objectColor * 0.3;
 *
 *     float3 finalColor = baseColor + rimColor;
 *     float alpha = saturate(length(finalColor) * 0.5);
 *
 *     return float4(finalColor, alpha);
 * }
 */

/**
 * ============================================
 * USAGE PARAMETERS (ARCHITECT ZERO)
 * ============================================
 *
 * Profile Data Artifacts:
 * - u_fresnelPower: 2.0 (soft rim)
 * - u_fresnelBias: 0.1 (subtle base)
 * - u_glowIntensity: 0.6 (medium emission)
 *
 * Knowledge Graph Nodes:
 * - u_fresnelPower: 3.0 (sharper rim)
 * - u_fresnelBias: 0.05 (minimal base)
 * - u_glowIntensity: 0.8 (strong emission)
 *
 * Color Palette:
 * - Certifications: #FFD700 (gold)
 * - Courses: #FF4DFF (pink)
 * - Projects: #4DBDFF (cyan)
 * - Achievements: #B13CFF (purple)
 *
 * Animation Timing:
 * - Hover transition: 300ms ease
 * - Pulse cycle: 2s ease-in-out
 * - Mouse tracking: 150ms cubic-bezier(0.34, 1.56, 0.64, 1)
 */
