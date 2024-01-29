"use server";

import qs from 'qs';
import axios from 'axios';

import { load } from 'cheerio';

const PLATE_AVAILABLE_NO_REGISTRATION_TEXT = 'var ErrorMessage = alert("Registration not found. Please check the information you entered and try again.");';

const extractHeaderValue = (headers: string[], key: string) =>
    headers
        .find(header => header.includes(key))
        ?.split(';')[0]
        .split('=')[1];

const client = axios.create({
    withCredentials: true
});

export type PlateResponse = {
    plate: string;
    error?: boolean;
    available: boolean;
    registration?: PlateInfo;
}

export type PlateInfo = {
    plate: string;
    plateClass: string;
    usage: string;
    expiration: string;
    state: string;
};

export const checkPlate = async (input: string): Promise<PlateResponse> => {
    console.log('Checking plate:', input);
    let cookieHeaders: string[] = [];
    let $ = await client
        .get('https://dmvcivls-wselfservice.ct.gov/Registration/VerifyRegistration')
        .then(res => {
            cookieHeaders = res.headers['set-cookie']!;
            return res;
        })
        .then(res => res.data)
        .then(load)
        .catch(console.error);

    if (!$ || !cookieHeaders.length) {
        console.log('Failed to collect cookies or parse inbound HTML, aborting.');
        return { plate: input, available: false };
    }

    let domToken = $('input[name="__RequestVerificationToken"]').attr('value');
    let headerToken = extractHeaderValue(cookieHeaders, '__RequestVerificationToken');
    if (!domToken || !headerToken) throw new Error('Failed to collect tokens.');

    let data = {
        __RequestVerificationToken: domToken,
        PlateNumber: input.toUpperCase(),
        PlateClassID: '25',
        submitButton: 'Continue'
    };

    let cookies = [
        `akavpau_wr=${extractHeaderValue(cookieHeaders, 'akavpau_wr')}`,
        `__RequestVerificationToken=${headerToken}`,
    ]

    $ = await client
        .post('https://dmvcivls-wselfservice.ct.gov/Registration/VerifyRegistration', qs.stringify(data), {
            headers: {
                'authority': 'dmvcivls-wselfservice.ct.gov',
                'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                'accept-language': 'en-US,en;q=0.9',
                'cache-control': 'max-age=0',
                'content-type': 'application/x-www-form-urlencoded',
                'Cookie': cookies.join('; '),
                'dnt': 1,
                'origin': 'https://dmvcivls-wselfservice.ct.gov',
                'referer': 'https://dmvcivls-wselfservice.ct.gov/Registration/VerifyRegistration',
                'sec-ch-ua': "\"Not_A Brand\";v=\"8\", \"Chromium\";v=\"120\"",
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '\"macOS\"',
                'sec-fetch-dest': 'document',
                'sec-fetch-mode': 'navigate',
                'sec-fetch-site': 'same-origin',
                'sec-fetch-user': '?1',
                'upgrade-insecure-requests': '1',
                'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
        })
        .then(res => res.data)
        .then(res => {
            if (res.includes('The requested page does not exist.'))
                throw new Error('Failed to reach results page.');
            return res;
        })
        .then(load)
        .catch(console.error);

    if (!$) return {
        plate: input,
        error: true,
        available: false
    }

    if ($('body').html()!.includes(PLATE_AVAILABLE_NO_REGISTRATION_TEXT)) return {
        plate: input,
        available: true
    };

    let divs = $('div.grid-item_body').toArray();
    let values = divs.map(div => ($ as any)(div).text().trim());

    if (!values.length) return {
        plate: input,
        available: false
    }

    let [plate, plateClass, usage, expiration, state] = values;

    return {
        plate: input,
        available: false,
        registration: {
            plate,
            plateClass,
            usage,
            expiration,
            state
        }
    };
};