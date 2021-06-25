const scraper = require('../index')
describe('Scraper Test', () => {
    test('Scrape no arguments', () => {

        return scraper.scrape_trending_page().then((data) => {
            expect(data).not.toHaveLength(0);
        });
    });

    test('Scrape default page', () => {
        const parameters = {page: 'default'};
        return scraper.scrape_trending_page(parameters).then((data) => {
            expect(data).not.toHaveLength(0);
        });
    });

    test('Scrape music page', () => {
        const parameters = {page: 'music'};
        return scraper.scrape_trending_page(parameters).then((data) => {
            expect(data).not.toHaveLength(0);
        });
    });

    test('Scrape movies page', () => {
        const parameters = {page: 'movies'};
        return scraper.scrape_trending_page(parameters).then((data) => {
            expect(data).not.toHaveLength(0);
        });
    });

    test('Scrape gaming page', () => {
        const parameters = {page: 'gaming'};
        return scraper.scrape_trending_page(parameters).then((data) => {
            expect(data).not.toHaveLength(0);
        });
    });

    test('Scrape illegal page', () => {
        const parameters = {page: 'ThisIsNotAnOption'};
        return scraper.scrape_trending_page(parameters).then((data) => {
            expect(data).not.toHaveLength(0);
        });
    });

    test('Scrape parseCreatorOnRise', () => {
        const parameters = {parseCreatorOnRise: 'true'};
        return scraper.scrape_trending_page(parameters).then((data) => {
            expect(data).not.toHaveLength(0);
        });
    });

    test('Scrape Japan Geolocation', () => {
        const parameters = {geoLocation: 'JP'};
        return scraper.scrape_trending_page(parameters).then((data) => {
            expect(data).not.toHaveLength(0);
        });
    });

    test('Scrape Japan Geolocation With Creator On Rise On Music Page', () => {
        const parameters = {geoLocation: 'JP', parseCreatorOnRise: 'true', page: 'music'};
        return scraper.scrape_trending_page(parameters).then((data) => {
            expect(data).not.toHaveLength(0);
        });
    });
});
