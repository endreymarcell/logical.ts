import { BaseState, Transition } from './transitions';

export type SideEffectBlueprint<
    Args extends Array<any>,
    Return extends Array<any>,
    State extends BaseState,
> = [
    Execute: (...args: Args) => Promise<Return>,
    SuccessTransition: Transition<Return, State>,
    FailureTransition: Transition<any, State>,
];

export type SideEffectInstance<
    Args extends Array<any>,
    Return extends Array<any>,
    State extends BaseState,
> = (...args: Args) => {
    name: PropertyKey;
    args: Args;
    blueprint: SideEffectBlueprint<Args, Return, State>;
};

export function createSideEffectInstance<State extends BaseState>() {
    return function <Args extends Array<any>, Return>(
        name: PropertyKey,
        blueprint: [
            Execute: (...args: Args) => Promise<Return>,
            SuccessTransition: Transition<[Return], State>,
            FailureTransition: Transition<any, State>,
        ],
    ) {
        return (...args: Args) => ({
            name,
            args,
            blueprint,
        });
    };
}

export function createSideEffects<State extends BaseState>() {
    return function <Blueprints extends Record<PropertyKey, SideEffectBlueprint<any, any, State>>>(
        blueprints: Blueprints,
    ) {
        type BlueprintsType = typeof blueprints;
        type Execute = 0;
        const sideEffectInstances = {} as {
            [name in keyof BlueprintsType]: SideEffectInstance<
                Parameters<BlueprintsType[name][Execute]>,
                Awaited<ReturnType<BlueprintsType[name][Execute]>>,
                State
            >;
        };
        for (const key of Object.keys(blueprints) as Array<keyof BlueprintsType>) {
            sideEffectInstances[key] = createSideEffectInstance<State>()(key, blueprints[key]);
        }
        return sideEffectInstances;
    };
}
