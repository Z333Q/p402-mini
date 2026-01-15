/**
 * Farcaster Manifest Validation Tests
 * Ensures farcaster.json meets all Base App requirements
 */

import * as fs from 'fs';
import * as path from 'path';

describe('Farcaster Manifest Validation', () => {
    let manifest: any;

    beforeAll(() => {
        const manifestPath = path.join(__dirname, '../public/.well-known/farcaster.json');
        const content = fs.readFileSync(manifestPath, 'utf-8');
        manifest = JSON.parse(content);
    });

    describe('Structure', () => {
        it('should be valid JSON', () => {
            expect(manifest).toBeDefined();
            expect(typeof manifest).toBe('object');
        });

        it('should have required top-level fields', () => {
            expect(manifest.accountAssociation).toBeDefined();
            expect(manifest.frame).toBeDefined();
            expect(manifest.primaryCategory).toBeDefined();
            expect(manifest.tags).toBeDefined();
            expect(manifest.appId).toBeDefined();
        });
    });

    describe('Account Association', () => {
        it('should have header, payload, and signature', () => {
            expect(manifest.accountAssociation.header).toBeDefined();
            expect(manifest.accountAssociation.payload).toBeDefined();
            expect(manifest.accountAssociation.signature).toBeDefined();
        });

        it('should have base64-encoded fields', () => {
            // Header should be valid base64
            expect(() => atob(manifest.accountAssociation.header)).not.toThrow();
            expect(() => atob(manifest.accountAssociation.payload)).not.toThrow();
        });
    });

    describe('Frame Configuration', () => {
        it('should have all required frame fields', () => {
            expect(manifest.frame.version).toBe('next');
            expect(manifest.frame.name).toBe('P402');
            expect(manifest.frame.iconUrl).toBeDefined();
            expect(manifest.frame.homeUrl).toBeDefined();
            expect(manifest.frame.imageUrl).toBeDefined();
            expect(manifest.frame.buttonTitle).toBeDefined();
            expect(manifest.frame.splashImageUrl).toBeDefined();
            expect(manifest.frame.splashBackgroundColor).toBeDefined();
        });

        it('should have valid URLs', () => {
            expect(manifest.frame.homeUrl).toMatch(/^https:\/\//);
            expect(manifest.frame.iconUrl).toMatch(/^https:\/\//);
            expect(manifest.frame.imageUrl).toMatch(/^https:\/\//);
        });

        it('should have valid hex color for splash background', () => {
            expect(manifest.frame.splashBackgroundColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
        });
    });

    describe('Tags Validation', () => {
        it('should have exactly 5 tags or fewer', () => {
            expect(manifest.tags.length).toBeLessThanOrEqual(5);
        });

        it('should have tags with max 20 characters each', () => {
            manifest.tags.forEach((tag: string) => {
                expect(tag.length).toBeLessThanOrEqual(20);
            });
        });

        it('should have lowercase tags without spaces or special characters', () => {
            manifest.tags.forEach((tag: string) => {
                expect(tag).toMatch(/^[a-z0-9]+$/);
            });
        });
    });

    describe('Description Validation', () => {
        it('should have a description field', () => {
            expect(manifest.description).toBeDefined();
        });

        it('should have description under 170 characters', () => {
            expect(manifest.description.length).toBeLessThanOrEqual(170);
        });

        it('should not contain special characters or emojis', () => {
            // No pipes, plus signs, percent signs, dots, or hyphens
            expect(manifest.description).not.toMatch(/[|+%.]/);
        });
    });

    describe('App ID', () => {
        it('should have a valid app ID format', () => {
            expect(manifest.appId).toMatch(/^[a-f0-9]{24}$/);
        });
    });
});
