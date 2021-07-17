import { Args, Awaited, Command, CommandContext, container } from '@sapphire/framework';
import { isFunction } from '@sapphire/utilities';
import type { Message } from 'discord.js';

/**
 * @since 1.0.0
 * SubCommandEntry represents a basic subcommand entry. Methods and command names are supported in core.
 * @see {@link SubCommandEntryCommand}
 * @see {@link SubCommandEntryMethod}
 */
export abstract class SubCommandEntry<ArgType extends Args = Args, CommandType extends Command<ArgType> = Command<ArgType>> {
	public readonly input: string | ((context: SubCommandEntry.RunContext<ArgType, CommandType>) => Awaited<string>);
	public readonly output: string;

	public constructor(options: SubCommandEntry.Options<ArgType, CommandType>) {
		this.input = options.input;
		if (!options.output && typeof options.input !== 'string') throw new ReferenceError('No output provided.');
		this.output = options.output ?? (options.input as string);
	}

	public async match(value: string, context: SubCommandEntry.RunContext<ArgType, CommandType>): Promise<boolean> {
		const input = isFunction(this.input) ? await this.input(context) : this.input;
		const caseInsensitive = container.client.options.caseInsensitiveCommands;
		return caseInsensitive ? input.toLowerCase() === value.toLowerCase() : input === value;
	}

	public abstract run(context: SubCommandEntry.RunContext<ArgType, CommandType>): unknown;
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace SubCommandEntry {
	/**
	 * The options for a SubCommandEntry.
	 * @property input Input represents the subcommand that the user will type in.
	 * @property output Output represents the method/command called for the subcommand.
	 * @example
	 * ```ts
	 * subCommands: [{
	 * 	input: ({ message }) => message.resolveKey('subcommands:set'),
	 * 	output: 'set'
	 * }]
	 * ```
	 */
	export interface Options<ArgType extends Args = Args, CommandType extends Command<ArgType> = Command<ArgType>> {
		input: string | ((context: RunContext<ArgType, CommandType>) => Awaited<string>);
		output?: string;
	}

	/**
	 * RunContext is passed to SubCommandManager.run() and to input (if it is a function)
	 * @see {@link SubCommandEntry.Options}
	 */
	export interface RunContext<ArgType extends Args = Args, CommandType extends Command<ArgType> = Command<ArgType>> {
		command: CommandType;
		message: Message;
		args: ArgType;
		context: CommandContext;
	}
}
