export const vertexShader = `
#define PHYSICAL
varying vec3 vViewPosition;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
vec3 softmax_w3( const in vec3 x, const in vec3 w) {
  vec3 e = pow(w, x);
  float sum = dot(e, vec3(1));
  return e/vec3(sum);
}
vec2 softmax_w2( const in vec2 x, const in vec2 w) {
  vec2 e = pow(w, x);
  float sum = dot(e, vec2(1));
  return e/vec2(sum);
}
vec3 softmax3( const in vec3 x ) {
  vec3 e = exp(x);
  float sum = dot(e, vec3(1));
  return e/vec3(sum);
}
vec3 quaternionTransform( vec4 q, vec3 v ) {
  return v + 2.0*cross(cross(v, q.xyz ) + q.w*v, q.xyz);
}
#include <uv_pars_vertex>
#include <uv2_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_INSTANCE_SCALE
    attribute vec3 instanceScale;
#endif
#ifdef USE_INSTANCE_ORIENTATION
    attribute vec4 instanceOrientation;
#endif
#ifdef USE_INSTANCE_OFFSET
    attribute vec3 instanceOffset;
#endif
#ifdef USE_INSTANCE_GREYSCALE
    attribute float instanceGreyScale;
    varying float vGreyScale;
#endif

#ifdef U6_ATTRIBUTES
U6_ATTRIBUTES
#endif

#ifdef BEZIER_TRANSFORM
uniform vec3 b1;
uniform vec3 b2;
uniform vec3 b3;
uniform vec3 b4;
uniform float modelYOffset;

vec3 CubicBezierP0 (float t, vec3 p) {
  float k = 1.0 - t;
  return k * k * k * p;
}
vec3 CubicBezierP1 (float t, vec3 p) {
  float k = 1.0 - t;
  return 3.0 * k * k * t * p;
}
vec3 CubicBezierP2 (float t, vec3 p) {
  return 3.0 * ( 1.0 - t ) * t * t * p;
}
vec3 CubicBezierP3 (float t, vec3 p) {
  return t * t * t * p;
}
#endif

varying vec2 vUv;
varying vec3 vPos;
void main() {
  vUv= uv;
  vPos = position;
	#include <uv_vertex>
	#include <uv2_vertex>
	#include <color_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
  #include <skinnormal_vertex>
#ifdef USE_INSTANCE_ORIENTATION
	objectNormal = quaternionTransform(instanceOrientation, objectNormal);
#endif
	#include <defaultnormal_vertex>
#ifndef FLAT_SHADED // Normal computed with derivatives when FLAT_SHADED
	vNormal = normalize( transformedNormal );
#endif
	#include <begin_vertex>

#ifdef BEZIER_TRANSFORM
	float t = position.y + modelYOffset;
	vec3 np = CubicBezierP0( t, b1 ) + CubicBezierP1( t, b2 ) + CubicBezierP2( t, b3 ) + CubicBezierP3( t, b4 );
	np.x += position.x/15.0;
	transformed = vec3(np.x, np.z, np.y);
#endif

  #include <morphtarget_vertex>

  // should really be after skinning, but variable renaming makes this annoying
#ifdef USE_INSTANCE_SCALE
	transformed *= instanceScale;
#endif
#ifdef USE_INSTANCE_ORIENTATION
	transformed = quaternionTransform(instanceOrientation, transformed);
#endif
#ifdef USE_INSTANCE_OFFSET
	transformed += instanceOffset;
#endif

#ifdef U6_MODELSPACE_TRANSFORM
U6_MODELSPACE_TRANSFORM
#endif

	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
  #include <fog_vertex>

#ifdef USE_INSTANCE_GREYSCALE
  vGreyScale = instanceGreyScale;
#endif
}

`;
export const gridShader = `

#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <uv2_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vUv;
varying vec3 vPos;

float grid(vec2 st, float res)
{
  vec2 grid = fract(st*res);
  return (step(res,grid.x) * step(res,grid.y));
}

void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( diffuse, opacity );
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );

  // Compute anti-aliased world-space grid lines
  vec3 totalEmissiveRadiance = emissive;
  // Pick a coordinate to visualize in a grid
  vec2 coord = 0.03*vec2(vPos.x, vPos.y);

  // Compute anti-aliased world-space grid lines
  vec2 grid = abs(fract(coord - 0.5) - 0.5) / fwidth(coord);
  float line = min(grid.x, grid.y);

  // Just visualize the grid lines directly
  totalEmissiveRadiance = (1.0 - min(line,1.0))*vec3(vUv.x,0.1,vUv.y);

	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	// accumulation
	#include <lights_phong_fragment>
  GeometricContext geometry;
  geometry.position = - vViewPosition;
  geometry.normal = normal;
  geometry.viewDir = normalize( vViewPosition );
  IncidentLight directLight;
  #if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
  	PointLight pointLight;
  	#pragma unroll_loop
  	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
  		pointLight = pointLights[ i ];
  		getPointDirectLightIrradiance( pointLight, geometry, directLight );
  		#ifdef USE_SHADOWMAP
  		float shadowCoef = all( bvec2( pointLight.shadow, directLight.visible ) ) ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
      directLight.color = mix(vec3(0.0, 0.0,0.0), vec3(.2, 0.1,1.0), 1.0 - shadowCoef);

      #endif
  		RE_Direct( directLight, geometry, material, reflectedLight );
  	}
  #endif
  #if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
  	SpotLight spotLight;
  	#pragma unroll_loop
  	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
  		spotLight = spotLights[ i ];
  		getSpotDirectLightIrradiance( spotLight, geometry, directLight );
  		#ifdef USE_SHADOWMAP
  		directLight.color *= all( bvec2( spotLight.shadow, directLight.visible ) ) ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowBias, spotLight.shadowRadius, vSpotShadowCoord[ i ] ) : 1.0;
  		#endif
  		RE_Direct( directLight, geometry, material, reflectedLight );
  	}
  #endif
  #if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
  	DirectionalLight directionalLight;
  	#pragma unroll_loop
  	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
  		directionalLight = directionalLights[ i ];
  		getDirectionalDirectLightIrradiance( directionalLight, geometry, directLight );
  		#ifdef USE_SHADOWMAP
      // float shadowCoef = all( bvec2( directionalLight.shadow, directLight.visible ) ) ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
      // directLight.color = mix(vec3(0.0, 0.0,0.0), vec3(1.0, 1.0,1.0), 1.0 - shadowCoef);
      directLight.color *= all( bvec2( directionalLight.shadow, directLight.visible ) ) ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;

  		#endif
  		RE_Direct( directLight, geometry, material, reflectedLight );
  	}
  #endif
  #if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
  	RectAreaLight rectAreaLight;
  	#pragma unroll_loop
  	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
  		rectAreaLight = rectAreaLights[ i ];
  		RE_Direct_RectArea( rectAreaLight, geometry, material, reflectedLight );
  	}
  #endif
  #if defined( RE_IndirectDiffuse )
  	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
  	#if ( NUM_HEMI_LIGHTS > 0 )
  		#pragma unroll_loop
  		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
  			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometry );
  		}
  	#endif
  #endif
  #if defined( RE_IndirectSpecular )
  	vec3 radiance = vec3( 0.0 );
  	vec3 clearCoatRadiance = vec3( 0.0 );
  #endif
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	// modulation
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	gl_FragColor = vec4( outgoingLight, diffuseColor.a );
	#include <tonemapping_fragment>
	#include <encodings_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}
`
