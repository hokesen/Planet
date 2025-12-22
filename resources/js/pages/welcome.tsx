import { ThreeBodyAnimation } from '@/components/three-body-animation';
import { dashboard, login, register } from '@/routes';
import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';

export default function Welcome({
    canRegister = true,
}: {
    canRegister?: boolean;
}) {
    const { auth } = usePage<SharedData>().props;

    return (
        <>
            <Head title="Welcome" />
            <div className="flex min-h-screen flex-col items-center bg-gradient-to-br from-[#0a0a0a] via-[#1a1a2e] to-[#16213e] p-6 text-white lg:justify-center lg:p-8 dark:from-[#050505] dark:via-[#0f0f1e] dark:to-[#0a1020]">
                <header className="mb-6 w-full max-w-[335px] text-sm not-has-[nav]:hidden lg:max-w-4xl">
                    <nav className="flex items-center justify-end gap-4">
                        {auth.user ? (
                            <Link
                                href={dashboard()}
                                className="inline-block rounded-sm border border-white/20 px-5 py-1.5 text-sm leading-normal text-white hover:border-white/40"
                            >
                                Dashboard
                            </Link>
                        ) : (
                            <>
                                <Link
                                    href={login()}
                                    className="inline-block rounded-sm border border-transparent px-5 py-1.5 text-sm leading-normal text-white/90 hover:border-white/20"
                                >
                                    Log in
                                </Link>
                                {canRegister && (
                                    <Link
                                        href={register()}
                                        className="inline-block rounded-sm border border-white/20 px-5 py-1.5 text-sm leading-normal text-white hover:border-white/40"
                                    >
                                        Register
                                    </Link>
                                )}
                            </>
                        )}
                    </nav>
                </header>
                <div className="flex w-full items-center justify-center opacity-100 transition-opacity duration-750 lg:grow starting:opacity-0">
                    <main className="flex w-full max-w-[335px] flex-col-reverse lg:max-w-4xl lg:flex-row">
                        <div className="flex-1 rounded-br-lg rounded-bl-lg bg-[#161615]/80 p-6 pb-12 text-[13px] leading-[20px] shadow-[inset_0px_0px_0px_1px_rgba(255,255,255,0.1)] backdrop-blur-sm lg:rounded-tl-lg lg:rounded-br-none lg:p-20">
                            <h1 className="mb-1 text-2xl font-medium text-white">
                                Planet
                            </h1>
                            <p className="mb-2 text-white/70">
                                Build your universe, one planet at a time. Watch
                                your galaxy of achievements expand.
                            </p>
                            <ul className="mb-4 flex flex-col lg:mb-6">
                                <li className="relative flex items-center gap-4 py-2 before:absolute before:top-1/2 before:bottom-0 before:left-[0.4rem] before:border-l before:border-white/20">
                                    <span className="relative bg-[#161615]/80 py-1">
                                        <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full border border-white/30 bg-[#161615] shadow-[0px_0px_1px_0px_rgba(255,255,255,0.1),0px_1px_2px_0px_rgba(255,255,255,0.1)]">
                                            <span className="h-1.5 w-1.5 rounded-full bg-white/50" />
                                        </span>
                                    </span>
                                    <span className="text-white/90">
                                        Transform goals into thriving planets
                                    </span>
                                </li>
                                <li className="relative flex items-center gap-4 py-2 before:absolute before:top-0 before:bottom-0 before:left-[0.4rem] before:border-l before:border-white/20">
                                    <span className="relative bg-[#161615]/80 py-1">
                                        <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full border border-white/30 bg-[#161615] shadow-[0px_0px_1px_0px_rgba(255,255,255,0.1),0px_1px_2px_0px_rgba(255,255,255,0.1)]">
                                            <span className="h-1.5 w-1.5 rounded-full bg-white/50" />
                                        </span>
                                    </span>
                                    <span className="text-white/90">
                                        Track progress with real-time metrics
                                    </span>
                                </li>
                                <li className="relative flex items-center gap-4 py-2 before:absolute before:top-0 before:bottom-0 before:left-[0.4rem] before:border-l before:border-white/20">
                                    <span className="relative bg-[#161615]/80 py-1">
                                        <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full border border-white/30 bg-[#161615] shadow-[0px_0px_1px_0px_rgba(255,255,255,0.1),0px_1px_2px_0px_rgba(255,255,255,0.1)]">
                                            <span className="h-1.5 w-1.5 rounded-full bg-white/50" />
                                        </span>
                                    </span>
                                    <span className="text-white/90">
                                        Organize missions into themed galaxies
                                    </span>
                                </li>
                                <li className="relative flex items-center gap-4 py-2 before:absolute before:top-0 before:bottom-1/2 before:left-[0.4rem] before:border-l before:border-white/20">
                                    <span className="relative bg-[#161615]/80 py-1">
                                        <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full border border-white/30 bg-[#161615] shadow-[0px_0px_1px_0px_rgba(255,255,255,0.1),0px_1px_2px_0px_rgba(255,255,255,0.1)]">
                                            <span className="h-1.5 w-1.5 rounded-full bg-white/50" />
                                        </span>
                                    </span>
                                    <span className="text-white/90">
                                        Keep momentum with deadline orbits
                                    </span>
                                </li>
                            </ul>
                        </div>
                        <div className="relative flex aspect-[7/5] items-center justify-center overflow-hidden rounded-tl-lg rounded-tr-lg bg-gradient-to-br from-[#0a0a0a] via-[#1a1a2e] to-[#16213e] lg:w-[440px] lg:flex-shrink-0 lg:rounded-tl-none lg:rounded-br-lg dark:from-[#050505] dark:via-[#0f0f1e] dark:to-[#0a1020]">
                            <div className="absolute inset-0">
                                <ThreeBodyAnimation />
                            </div>
                            <div className="absolute inset-0 rounded-t-lg shadow-[inset_0px_0px_0px_1px_rgba(255,255,255,0.1)] lg:rounded-t-none lg:rounded-r-lg" />
                        </div>
                    </main>
                </div>
                <div className="hidden h-14.5 lg:block"></div>
            </div>
        </>
    );
}
