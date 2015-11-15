/* global Skynet, PAGES, $, Q, _i, TECHS_BY_ID, isNumeric, ocalc, _h, nf */

(function (_s) {
	const cfg = {
		deactivate_finished_research : 'deactivate.finished.research'
	};
	const cfg_def = [
		{key : cfg.deactivate_finished_research, label : 'deactivate finished research', type : 'boolean', def : true}
	];
	_s.addSettings(cfg_def);

	Promise.all([_s.page, _s.config, _s.player, _s.planet]).then(function (args) {
		const page = args[0];
		const config = args[1];
		const player = args[2];
		const planet = args[3];
		if (!config['feature.active']) {
			return;
		}
		if (page === PAGES.research && config[cfg.deactivate_finished_research]) {
			disableResearch();
		}
		if (page === PAGES.resources || page === PAGES.shipyard || page === PAGES.defense ||
			page === PAGES.station) {
			addDetailScreenInfo(player, planet);
		}
	});

	function disableResearch() {
		_s.player.then(function (player) {
			const techs = player.techs || {};
			const maxLevel = {
				'114' : 8,
				'120' : 12,
				'199' : 1
			};
			const container = $('#buttonz');
			Object.keys(techs).forEach(function (key) {
				const l = maxLevel[key];
				if (l && l <= techs[key]) {
					//noinspection JSValidateTypes
					container.find('.research' + key).parent().prop('class', 'off');
					container.find('.research' + key + ' a.fastBuild').remove();
				}
			});
		});
	}

	function addDetailScreenInfo(player, planet) {
		const target = Q('#detail.detail_screen');
		const observer = new MutationObserver(function (mutations) {
			mutations.forEach(function (mutation) {
				var i, me;
				//noinspection JSUnresolvedVariable
				for (i = 0; i < mutation.addedNodes.length; i++) {
					//noinspection JSUnresolvedVariable
					me = $(mutation.addedNodes[i]);
					if (me.prop('id') === 'content') {
						const ref = _i(me.parent().find('input[name="type"]').val());
						if (ref > 199) {
							const numField = me.find('#number');
							numField.prop('autocomplete', 'off');
							numField.bind('keydown', function (event) {
								var v = _i(numField.val() || 0);
								switch (event.which) {
									case 38:
										numField.val(v + 1);
										break;
									case 40:
										v = v - 1;
										numField.val(v >= 0 ? v : 0);
										break;
								}
								triggerChange(player, planet);
							});
							numField.bind('keyup change click focus', function () {
								triggerChange(player, planet);
							});
						}
						const item = TECHS_BY_ID[ref];
						if (item.p && isNumeric(item.p.energy) && item.p.energy < 0) {
							const elem = me.find('ul.production_info li:last span');
							const enrg = _i($('#resources_energy').text().trim().replace(/\./, '')) -
								_i(elem.text().trim());
							if (enrg < 0) {
								const prodSat = ocalc.production(TECHS_BY_ID[212], 1, player, planet, _s.uni.speed);
								const amount = Math.ceil(-enrg / prodSat.energy);
								elem.parent().append($(_h('b', '', '(',
									['b', {text : enrg, 'class' : 'overmark'}],
									' &#8793; ' + amount + ' ' + TECHS_BY_ID[212].name, ')')));
							}
						}
					}
				}
			});
		});
		//noinspection JSCheckFunctionSignatures
		observer.observe(target, {
			childList : true
		});

	}

	function triggerChange(player, planet) {
		const detail = $('#detail');
		const ref = detail.find('input[name="type"]').val();
		//const item = TECHS_BY_ID[ref];
		const amount = _i($('#number').val() || 1);
		switch (ref) {
			case '212':
				const prodSat = ocalc.production(TECHS_BY_ID[212], amount, player, planet, _s.uni.speed);
				const out = $('#content').find('ul.production_info li:last span.undermark');
				out.text(' (+' + nf().format(prodSat.energy) + ')');
				break;
			default:
				break;
		}
		const costs = ocalc.costs(ref, amount);
		const cont = $('#costs');
		Object.keys(costs).forEach(function (key) {
			if (costs[key] < 1) {
				return;
			}
			const out = cont.find('li.' + key + ' div.cost');
			out.text(nf().format(costs[key]));
			if (planet.resources[key] < costs[key]) {
				out.addClass('overmark');
			} else {
				out.removeClass('overmark');
			}
		});
	}

})(Skynet);