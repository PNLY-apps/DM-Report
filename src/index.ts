import { APIInteraction, InteractionType, InteractionResponseType, APIChatInputApplicationCommandGuildInteraction, APIMessageApplicationCommandDMInteraction } from "discord-api-types/v10"
import { isValidRequest, PlatformAlgorithm } from "discord-verify"
import { finishReport, setChannel, startReport } from "./discord/utils"

export interface Env {
	DB: KVNamespace
	TOKEN: string
	APP_ID: string
	PUBLIC_KEY: string
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		if (await isValidRequest(
			request,
			env.PUBLIC_KEY,
			PlatformAlgorithm.Cloudflare
		)) {
			const interaction: APIInteraction = await request.json()
			if (interaction.type == InteractionType.Ping) {
				return new Response(JSON.stringify({
					type: InteractionResponseType.Pong
				}, null, 2), { headers: { "Content-Type": "application/json;charset=UTF-8" }, status: 200 })
			} else if (interaction.type == InteractionType.ApplicationCommand) {
				if (interaction.guild_id) {
					const guildInteraction = interaction as APIChatInputApplicationCommandGuildInteraction
					if (guildInteraction.data.name == 'report') {
						return await finishReport(
							guildInteraction,
							env
						)
					} else if (guildInteraction.data.name == 'setchannel') {
						return await setChannel(
							guildInteraction,
							env
						)
					}
				} else {
					const dmInteraction = interaction as APIMessageApplicationCommandDMInteraction
					return await startReport(
						dmInteraction,
						env
					)
				}
			}
		}
		return new Response(null, {status: 401})
	}
}
