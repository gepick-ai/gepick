import { Contribution, IContributionProvider, InjectableService, createContribution } from "../dependency-injection";
import { Command, CommandHandler } from "./command";
import { CommandRegistry } from "./command-registry";

/**
 * The command contribution should be implemented to register custom commands and handler.
 */
export interface ICommandContribution {
  /**
   * Register commands and handlers.
   */
  registerCommands: (commands: CommandRegistry) => void;
}
export const [ICommandContribution, ICommandContributionProvider] = createContribution("CommandContribution");
export interface ICommandContributionProvider extends IContributionProvider<ICommandContribution> { }

export const [ICommand, ICommandProvider] = createContribution("Command");
export interface ICommand extends Command, CommandHandler { }
export interface ICommandProvider extends IContributionProvider<ICommand> { }

/**
 * 一个自定义的Command命令必须继承自CommandContribution，以便能够加入到命令系统中。
 */
@Contribution(ICommand)
export abstract class CommandContribution extends InjectableService implements ICommand {
  declare static Id: string;
  declare static Category?: string;
  declare static Label: string;

  public readonly id: string;
  public readonly category: string | undefined;
  public readonly originalCategory: string | undefined;
  public readonly label: string;
  public readonly originalLabel: string;

  constructor() {
    super();

    const staticProps = this.constructor as typeof CommandContribution;

    this.id = staticProps.Id;
    this.category = staticProps.Category;
    this.originalCategory = staticProps.Category;
    this.label = staticProps.Label;
    this.originalLabel = staticProps.Label;
  }

  /**
   * Execute this handler.
   *
   * Don't call it directly.
   */
  abstract execute(...args: any[]): void;

  /**
   * Test whether this handler is enabled (active).
   */
  isEnabled?(...args: any[]): boolean;
  /**
   * Test whether menu items for this handler should be visible.
   */
  isVisible?(...args: any[]): boolean;
  /**
   * Test whether menu items for this handler should be toggled.
   */
  isToggled?(...args: any[]): boolean;
}
