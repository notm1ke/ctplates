"use client";

import styles from "./page.module.css";

import { PlateResponse, checkPlate } from '@/util';
import { ChangeEvent, FormEvent, useRef, useState } from 'react';

type Style = keyof typeof styles | null;

const css = (...args: Style[]) =>
    args
        .filter(Boolean)
        .map(rule => styles[rule!] ?? rule)
        .join(' ');

const ResultBox = ({ result }: { result: PlateResponse }) => {
    if (result.error) return (
        <div className={styles['result-box']}>
            <div className={styles['result-box-header']}>
                <div className={css('result-box-header-text', 'text-red')}>Error</div>
            </div>
            <div className={styles['result-box-body']}>
                <div className={styles['result-box-body-text']}>
                    An error occurred while checking the plate.
                </div>
            </div>
        </div>
    );

    if (result.available) return (
        <div className={styles['result-box']}>
            <div className={css('result-box-header', 'text-green')}>
                <span>Available</span>
            </div>
            <div className={styles['result-box-body']}>
                <span>
                    This plate is available for registration,{" "}
                    <a
                        className={css('shine', 'text-link')}
                        href="https://dmvcivls-wselfservice.ct.gov/SpecialPlate/Individual"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        order it here
                    </a>.
                </span>
            </div>
        </div>
    );

    return (
        <div className={styles['result-box']}>
            <div className={css('result-box-header', 'text-red')}>
                <span>Unavailable</span>
            </div>
            <div className={styles['result-box-body']}>
                <span>This plate is currently taken.</span>

                {
                    result.registration && (
                        <table className={styles['result-box-body-table']}>
                            <tbody>
                                <tr>
                                    <td className={css('result-row-padding', 'table-key')}>Plate Name</td>
                                    <td>{result.registration.plate}</td>
                                </tr>
                                <tr>
                                    <td className={css('result-row-padding', 'table-key')}>Plate Class</td>
                                    <td>{result.registration.plateClass}</td>
                                </tr>
                                <tr>
                                    <td className={css('result-row-padding', 'table-key')}>Usage</td>
                                    <td>{result.registration.usage}</td>
                                </tr>
                                <tr>
                                    <td className={css('result-row-padding', 'table-key')}>Status</td>
                                    <td>{result.registration.state.split(' ')[0]}</td>
                                </tr>
                                <tr>
                                    <td className={css('result-row-padding', 'table-key')}>Expiration</td>
                                    <td>{result.registration.expiration}</td>
                                </tr>
                            </tbody>
                        </table>
                    )
                }
            </div>
        </div>
    );
}

const HomePage = () => {
    const [plateText, setPlateText] = useState('7AS·MM5');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<PlateResponse | null>(null);

    const inputRef = useRef<HTMLInputElement>();

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        let value = e
            .target
            .value
            .toUpperCase()
            .replace(/\./g, '·')
            .replace(/[^A-Z0-9·]/g, '');

        setPlateText(value);
    };

    const validate = (value: string) => {
        if (!value) return false;
        if (value.length < 3 || value.length > 7) return false;
        if (value.split('·').length > 2) return false;
        if (value.indexOf('·') === 0 || value.indexOf('·') === value.length - 1) return false;
        if (!/^[A-Z0-9·]{3,7}$/.test(value)) return false;
        
        return true;
    }

    const submit = (e: FormEvent) => {
        e.preventDefault();

        if (!validate(plateText)) {
            inputRef.current!.classList.add('animate__animated');
            inputRef.current!.classList.add('animate__shakeX');
            inputRef.current!.classList.add('animate__fast');

            setTimeout(() => {
                inputRef.current!.classList.remove('animate__animated');
                inputRef.current!.classList.remove('animate__shakeX');
                inputRef.current!.classList.remove('animate__fast');
            }, 1000);
            return;
        }

        setLoading(true);
        checkPlate(plateText)
            .then(res => setResult(res))
            .catch(err => console.error('Error looking up plate', err))
            .finally(() => setLoading(false));
    }

    return (
        <>
            <div className={styles['license-plate-hero']}>
                <div className={css('license-plate', loading ? 'loading': '')}>
                    <img src="/ct.svg" alt="CT State Outline" className={styles['state-outline']} />
                    <div className={styles['state-name']}>Connecticut</div>
                    <div className={styles['plate-text']}>
                        <form onSubmit={e => submit(e)}>
                            <input
                                ref={inputRef as any}
                                type="text"
                                minLength={3}
                                maxLength={7}
                                value={plateText}
                                disabled={loading}
                                onChange={handleInputChange}
                            />
                        </form>
                    </div>
                    <div className={styles['constitution-state']}>Constitution State</div>
                </div>
            </div>
            <div className={styles['instructions']}>
                {
                    !result && (
                        <p>
                            Input your desired license plate above and hit enter to check availability.
                        </p>
                    )
                }
                {
                    result && <ResultBox result={result} />
                }
            </div>
        </>
    );
}

export default HomePage;