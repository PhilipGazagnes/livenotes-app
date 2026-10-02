import { describe, it, expect } from 'vitest'
import { normalizeSpotifyTitle } from '../spotifyTitleNormalization'

describe('normalizeSpotifyTitle', () => {
  it('leaves a plain title untouched', () => {
    expect(normalizeSpotifyTitle('Bohemian Rhapsody')).toEqual({
      key: 'bohemian-rhapsody',
      strippedTitle: 'Bohemian Rhapsody',
      isDerivative: false,
    })
  })

  it('collapses a dash-suffixed live version onto the plain title', () => {
    expect(normalizeSpotifyTitle('Bohemian Rhapsody - Live Aid')).toEqual({
      key: 'bohemian-rhapsody',
      strippedTitle: 'Bohemian Rhapsody',
      isDerivative: true,
    })
  })

  it('collapses a long dash-suffixed live version', () => {
    const result = normalizeSpotifyTitle(
      'Bohemian Rhapsody - Live At The Montreal Forum / November 1981'
    )
    expect(result).toEqual({
      key: 'bohemian-rhapsody',
      strippedTitle: 'Bohemian Rhapsody',
      isDerivative: true,
    })
  })

  it('collapses a parenthetical live suffix', () => {
    expect(
      normalizeSpotifyTitle("Wonderwall (Live from Dublin, 16 August '25)")
    ).toEqual({
      key: 'wonderwall',
      strippedTitle: 'Wonderwall',
      isDerivative: true,
    })
  })

  it('collapses a remastered suffix', () => {
    expect(normalizeSpotifyTitle('Wonderwall - Remastered')).toEqual({
      key: 'wonderwall',
      strippedTitle: 'Wonderwall',
      isDerivative: true,
    })
  })

  it('collapses a "Spotify Singles" suffix', () => {
    expect(normalizeSpotifyTitle('Wonderwall - Spotify Singles')).toEqual({
      key: 'wonderwall',
      strippedTitle: 'Wonderwall',
      isDerivative: true,
    })
  })

  it('collapses a remix suffix', () => {
    expect(normalizeSpotifyTitle('Despacito - Remix')).toEqual({
      key: 'despacito',
      strippedTitle: 'Despacito',
      isDerivative: true,
    })
  })

  it('does not strip a dash-joined title with no derivative keyword', () => {
    expect(normalizeSpotifyTitle("Say Something - I'm Giving Up on You")).toEqual({
      key: 'say-something-i-m-giving-up-on-you',
      strippedTitle: "Say Something - I'm Giving Up on You",
      isDerivative: false,
    })
  })

  it('collapses a "Revisited" suffix', () => {
    expect(normalizeSpotifyTitle("Don't Stop Me Now - ...Revisited")).toEqual({
      key: 'don-t-stop-me-now',
      strippedTitle: "Don't Stop Me Now",
      isDerivative: true,
    })
  })

  it('folds accents and case the same way as plain titles', () => {
    expect(normalizeSpotifyTitle('Déspacito - Remix').key).toBe(
      normalizeSpotifyTitle('despacito').key
    )
  })
})
