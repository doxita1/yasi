// Five short original examples per day, in the same order as the supplementary expressions.
const week = (lines) =>
  lines
    .trim()
    .split("\n")
    .map((row) => row.split("|"));
export const extraExamples = [
  week(`My first name is Nina.|Please spell your last name.|A new starter joins us today.|Mia is our team leader.|Wait at the reception desk.
My line manager approves my leave.|The design team meets on Tuesdays.|My main duty is checking orders.|Can I visit during office hours?|Ask a staff member for directions.
Use the main entrance on King Street.|Please sign in before going upstairs.|Bring photo ID for your badge.|Leave the envelope at the front desk.|There are seats in the waiting area.
The security guard checked my name.|You need a building pass after six.|Write your first name on your name tag.|The floor plan shows both exits.|Our meeting point is outside the café.
Could I have your contact number?|Send a message when you get here.|Please leave a voicemail if I'm busy.|I'll reply by email this afternoon.|Can you call back after lunch?
Has the start time changed?|Trains often run late on this line.|I like to arrive early for visits.|The tour started on time.|Please keep me informed about the visit.`),
  week(`The receptionist checked the appointment book.|Is the ten o'clock time slot free?|I prefer the morning session.|What are your opening hours on Fridays?|I need to make an appointment.
Snow forced us to delay a visit.|Could we push back a meeting by an hour?|The driver returned later that day.|Tuesday afternoon is fully booked.|A double booking left two teams waiting.
Is an earlier appointment available?|The shop accepts deliveries before noon.|I can help after lunch.|Meet us at half past nine.|Please confirm the order by midday.
I'm free on Friday until ten.|There is a schedule conflict on Wednesday.|Which time would suit both sides?|Can we agree on an alternative date?|The mechanic can fit us in tomorrow.
The delivery van is outside.|Leave the envelope at the front counter.|I need to check the driver's schedule.|We moved the drop-off point indoors.|Could you help unload boxes at nine?
Sorry for the last-minute change.|I apologise for the delay this morning.|Please give advance warning of large orders.|Could you confirm in writing today?|Remember to update the calendar afterwards.`),
  week(`The bus fare includes one change.|I'd like a single ticket to York.|A return ticket is cheaper here.|Check the platform number before boarding.|We board a train at East Station.
The post office is on the corner.|Wait beside the bridge.|Walk past the bank and turn left.|My office is opposite the library.|Cross at the crossroads.
The clinic is five minutes on foot.|Use the pedestrian entrance by the trees.|A covered walkway connects the two halls.|Please keep boxes off the cycle lane.|A nearby station has a lift.
The diverted service skips Market Square.|A road closure has delayed the bus.|The replacement bus leaves at noon.|Follow the temporary sign to the exit.|The revised route goes through River Street.
Follow the signs to platform two.|Turn right at the lights.|Cross the square to reach the hotel.|Head uphill until you see the tower.|If you reach the bridge, double back.
We change trains at the central station.|The bus fills up during peak hour.|Check the departure board for a platform.|A service disruption affected three routes.|Allow extra time for the connection.`),
  week(`Please photograph the damaged item.|Your order reference appears on the receipt.|Can you confirm the delivery date?|The refund policy covers damaged goods.|Customer service has replied to my email.
The lamp shade is cracked.|A cracked surface can cut your hand.|The electrician replaced the faulty switch.|Do we have a spare cable here?|The repair kit includes a small brush.
The shop asked for the original receipt.|My bank statement shows the payment.|Which payment method did you use?|Write the purchase date on the form.|My online order arrived yesterday.
Please choose a pickup window.|Has the collection address changed?|Attach the return label to the box.|Keep the original packaging until you test it.|A courier service will collect the parcel.
The delivery charge is five pounds.|The label says postage paid.|We replaced the switch free of charge.|The shop will refund the difference.|A standard fee applies after seven days.
Quote the case number when you call.|Thank you for your prompt reply.|I still have a pending request.|Please contact the seller about the cable.|We close a case after checking the repair.`),
  week(`Volunteer work helped me gain confidence.|Listening closely is a practical skill.|No previous experience is required.|The next training session is on Monday.|This is an entry-level role.
I manage a timetable for six tutors.|I stayed late to support a colleague.|Can you lead a workshop on Saturday?|We organise materials before the class.|We track attendance with a paper register.
I often ask for guidance on new tools.|The tutor encouraged us to take initiative.|How do you manage your time?|I set priorities before checking messages.|After training, I could work without supervision.
What is your current job title?|Teaching was a big career change.|I have a part-time role at the library.|My current position involves planning lessons.|My former employer ran a bookshop.
Active listening helps me catch small details.|Problem solving matters more than speed here.|Clear communication prevents repeated mistakes.|Her attention to detail saved the order.|I developed team leadership through volunteering.
I will shadow a colleague on Tuesday.|May I observe a lesson before teaching?|It takes time to practise a skill.|New tutors receive coaching each week.|You can review your progress with me.`),
  week(`The night shift finished at six.|The morning shift receives fresh milk.|Our shift pattern changes each month.|I can work overtime this weekend.|Who will be on duty tomorrow?
Please read the handover note.|The incoming team will order supplies.|Mark unfinished work in the log.|The shift supervisor has the keys.|Can you pass on a message?
The due date is next Thursday.|We set a time limit for each check.|We should finish on schedule today.|Checking the fridge is an urgent task.|You may request more time before Friday.
Check the stock level before ordering.|I will order supplies this afternoon.|Put clean jars on the storage shelf.|The spare stock is in the back room.|Six bottles is our reorder point.
Record a reading after ten minutes.|If the reading is high, check again.|The temperature log is by the fridge.|Enter a figure in the final column.|Both shifts must sign the logbook.
The extra order is pending approval.|A broken seal is an unresolved problem.|Moving the milk was a corrective action.|I need to update a colleague about the order.|We finish a handover by checking both signatures.`),
  week(`The monthly rent is lower here.|The security deposit covers damage.|Please read the rental agreement first.|Our landlord lives nearby.|A tenant must report a leak promptly.
The heating cost doubles in winter.|Does the water charge include the garden?|I photographed the electricity meter.|We divide shared expenses equally.|Is Wi-Fi included in the rent?
A bare room may need furniture.|The fridge is the only kitchen appliance.|Does this flat have a shared bathroom?|The small studio has a private entrance.|There is a storage cupboard under the stairs.
Can I renew a lease by email?|The contract length is four months.|What is the notice period?|My move-in date is 3 September.|Early termination requires written notice.
The studio is the most affordable option.|My monthly allowance must cover travel.|A parking permit is a hidden cost.|Which flats are in my price range?|The rent increase starts in May.
I'd like to book a viewing.|May I inspect the room this evening?|Remember to ask about repairs.|I need a day before I sign a contract.|When can I collect the keys?`),
  week(`Unclear wording made the instruction hard to follow.|What is the exact meaning of entry?|Could you rephrase a question from the meeting?|Please repeat a detail I missed.|I'll repeat the plan to confirm understanding.
We recorded each visitor enquiry.|The ticket price includes the audio tour.|The map shows the locker location.|Has the opening date been announced?|Which access route is step-free?
The budget is on our meeting agenda.|Finding a map supplier is my action item.|Our note taker missed the date.|Would you chair a meeting tomorrow?|Please circulate the notes after lunch.
Let's leave time for open discussion.|The cost is a relevant point.|May I ask a follow-up question?|I'd like to invite comments from reception.|You can interrupt politely to clarify a number.
We need a shared decision about the signs.|We changed the plan by mutual consent.|Can we agree on a plan today?|The chair helped settle a dispute.|Both groups found common ground on cost.
Adding a map was the key decision.|What is the next deadline?|We should assign a task to each volunteer.|We need to confirm ownership of the report.|Her closing remark thanked the whole team.`),
  week(`Every drill receives a routine inspection.|A visual check revealed a cracked handle.|How can we test a device safely?|The photo helps us identify damage.|Use this form to report a fault.
My online reservation has disappeared.|Choose an available item from the list.|Can I confirm a booking by phone?|We reserve equipment a day ahead.|May I borrow a tool until Friday?
The locker number appears in the email.|Keep your access code private.|The pickup deadline is noon tomorrow.|Scan a code to open the door.|Enter your PIN to retrieve an item.
Book ahead during the school holidays.|There is a limited supply of drills.|Please put me on the waiting list.|An early request gives us time to inspect it.|Saturday morning is a period of peak demand.
The return window ends at five.|The loan period is one week.|A late fee applies after Tuesday.|Bring the case to the return counter.|We check for damage after every loan.
The notice explains reservation expiry.|You can cancel a request before inspection.|May I extend a loan for two days?|Can staff reactivate an account at reception?|You will receive a notification when it is ready.`),
  week(`A double booking is a service failure.|We called each affected customer.|I would like to make a formal complaint.|The missed booking delayed our interview.|An immediate reply was the customer's expectation.
We should acknowledge an error promptly.|Please offer an apology for the delay.|Let me listen carefully before I answer.|We can show understanding without promising a refund.|I need to correct a mistake on the bill.
Please attach a receipt to the email.|The taxi driver provided an itemised bill.|Could you send a clear photo?|Put the taxi fare on your expense report.|You can submit a claim on Monday.
The manager agreed to offer compensation.|We received a complimentary hour in the quiet room.|The booking credit expires next month.|They sent flowers as a goodwill gesture.|A clear plan may restore confidence.
The taxi fare is an eligible expense.|My travel allowance covers local buses.|The reimbursement limit is twenty pounds.|Our approval process takes two days.|We can repay a fare after checking the amount.
They found an alternative venue nearby.|I'd like to reschedule a visit.|Accounts will issue a voucher today.|May I transfer a reservation to another branch?|Please confirm a solution before inviting the client.`),
  week(`The graph shows an upward trend in visits.|There was a gradual increase in enquiries.|A sharp rise in orders surprised us.|March is the starting point of the chart.|Our annual total includes all branches.
We noticed a slight decline in May.|The rate fell by one percentage point.|The absolute difference is ten repairs.|The month-on-month change was positive.|Please check the final figure.
June had the highest value for enquiries.|Repairs reached a record level in May.|Summer is our seasonal peak.|April marked a turning point for the workshop.|The workshop was running at maximum capacity.
Orders arrived at a steady rate.|There was little variation between the weeks.|The last quarter showed flat growth.|We saw constant demand throughout June.|An unchanged figure is still worth recording.
Each branch had an equal share.|One shop handled the majority share.|A small proportion of orders were cancelled.|Roughly half the repairs involved wheels.|The combined total was ninety jobs.
What is the overall picture for the quarter?|Ten fewer jobs is a significant change for us.|This minor fluctuation does not explain the decline.|Compare periods of equal length.|Can you describe a pattern without assuming a cause?`),
  week(`Fatigue was a contributing factor.|Lighting is one working condition we can change.|Better training quality may improve output.|The tool replacement took place in March.|Staff experience varied between teams.
We found no direct effect on speed.|Fewer complaints were an unexpected outcome.|Clear labels may reduce errors.|Hiring a mechanic could increase capacity.|Break times may influence behaviour.
Have you considered other factors?|When is it fair to exclude a case?|A second check can eliminate a fault.|How could we check an assumption?|We collected fresh data to test a theory.
Short breaks were associated with more errors.|An observed change needs an explanation.|Poor lighting is a related issue.|The trial does not prove a causal link.|The new rota may coincide with quieter weeks.
A damaged sensor is a likely cause.|We still need additional evidence.|My initial observation was that errors fell.|Let's compare outcomes for the two shifts.|We need to investigate further before changing policy.
The records provide strong evidence of a drop.|We can offer only a tentative conclusion.|The figures do not identify a cause.|Break length was the independent variable.|The control group kept the old schedule.`),
  week(`What is the central argument of your paragraph?|One example supplies relevant evidence.|A personal example can make the reason clear.|I can state my main point in a sentence.|Please explain your reasoning before the vote.
Recording questions raises a privacy concern.|A possible drawback is lower attendance.|The evening class has an attendance issue.|May I raise an objection?|How would you address a worry about recording?
Flexible hours offer a practical benefit.|An audio summary is a realistic option.|The actual result surprised the tutor.|We can put a plan into action this week.|One practical difficulty is finding an empty room.
Her reply shows partial agreement.|In some cases, live lessons are essential.|A recording works under certain conditions.|Generally speaking, I prefer small classes.|Three weeks seems a reasonable limit for a trial.
An anecdote can illustrate a point.|Can you give a specific case?|The night nurse's story is a real-life illustration.|A shift worker, for instance, might miss Monday.|Add a concrete detail about what changed.
We should consider the impact on shy students.|A tutor offered a different perspective.|The trial must protect student privacy.|Can the class fit your working schedule?|A short trial lets us balance priorities.`),
  week(`The wholesale price excludes delivery.|Is there a volume discount for two hundred cups?|Our order size depends on storage.|The initial payment is due on Friday.|This exceeds the purchase budget.
What is the price per item?|The quoted price lasts thirty days.|Is delivery included in this offer?|We should compare quotations before buying.|The total payable is two hundred pounds.
The first batch arrived on Monday.|Can you arrange a partial shipment?|We have little warehouse space.|A monthly delivery interval would suit us.|We agreed to staged payment.
We can negotiate terms this afternoon.|Can you offer a discount on blue cups?|We could compromise on colour.|I cannot accept an offer without a date.|Our counteroffer keeps the price but splits delivery.
The minimum order is a hundred cups.|Excess stock would block the stairs.|The buyer has a purchase limit.|What is the available capacity of the shelves?|A single order would fill a cupboard.
Lasting quality matters more than the colour.|The smaller pack has an affordable price.|We need to compare suppliers fairly.|A stronger cup may be worth the cost.|Fewer replacements could produce a long-term saving.`),
  week(`Our target population includes every local adult.|A monthly pass holder may travel daily.|An occasional rider may miss the survey link.|We drew a random sample of addresses.|Explain the sampling method in the report.
I found the survey link on my ticket.|Return the completed form by Friday.|You may decline to answer any question.|The number of participants reached eighty.|An incomplete response can still contain useful information.
The collection site creates selection bias.|A regular commuter may value an early bus.|Non-riders are an under-represented group.|Access to transport varies by neighbourhood.|Did everyone receive a survey invitation?
Voluntary participation was clear from the notice.|Each anonymous response had a number.|People must give consent before we record them.|You can withdraw at any time.|Record a refusal without asking for a name.
We conduct interviews at the market.|The team will gather opinions from shoppers.|Staff observe behaviour at the entrance.|Please record the location of each interview.|We can compare groups after the last session.
The headline result hides a difference between areas.|This survey has limited scope.|A margin of error cannot fix a biased sample.|The response pattern changed on Saturday.|Who will interpret the data for residents?`),
  week(`I reported a loose handrail on the stairs.|A slippery floor needs a warning sign.|The blocked exit was behind the stage.|Never leave a fire door open.|We closed the path to reduce injury risk.
Put a warning sign near the steps.|Fit a protective cover over the cable.|The morning safety check takes ten minutes.|A temporary barrier keeps visitors out.|Show guests the evacuation route.
A qualified engineer inspected the rail.|The maintenance team arrived before noon.|I submitted a repair request online.|The spare component arrived yesterday.|Has the repair schedule changed?
The west corridor is closed to visitors.|The sign on this door says staff only.|This area requires authorised access.|Could you guide visitors to the lift?|Please use the designated entrance.
Stand a safe distance from the barrier.|Keep the corridor clear during the rehearsal.|Guests should stay behind the line.|Please avoid the stairs until the inspection.|Can wheelchair users use the lift today?
The report describes the severity of harm.|Closing the door lowers the likelihood of injury.|A loose rail needs immediate action.|Repainting the curtain has lower priority.|The engineer completed a risk assessment.`),
  week(`We tested the draft instructions on a new laptop.|A specific comment is easier to act on.|Try to keep a respectful tone.|The reviewer gave a balanced response.|Peer review revealed a missing step.
May I highlight a problem in step three?|This unclear step confused two readers.|The missing information was the login code.|Could I suggest an improvement to the order?|Please explain the impact on a new user.
Read the updated version before replying.|We should reorder the steps in the guide.|I will revise the wording this afternoon.|Let's test the change with another reader.|We can publish a draft for review.
I welcome suggestions about the introduction.|Could we consider another view?|I took a breath so I could respond calmly.|It can be hard to accept criticism.|I can defend a choice if I explain it.
Try reading from the reader's perspective.|The menu did not meet a common user expectation.|My first impression was that the guide was clear.|Assume the reader has no prior knowledge.|Supportive language made the comment easier to hear.
Could I clarify an intention behind my note?|I acknowledge the point about new users.|Let's avoid blame and fix the sequence.|Please explain the context of the change.|We should agree a revision before testing.`),
  week(`Please bring back the reusable container.|A single-use bag goes home with each order.|Choose packing material that protects the glass.|Food waste enters a different waste stream.|The nearest recycling point is outside.
Fuel expense rose when the van made extra trips.|The maintenance cost includes replacement handles.|Buying crates requires an initial investment.|Our operating budget covers two delivery routes.|Each return trip affects distribution cost.
Shared deliveries may reduce carbon emissions.|The report estimates resource consumption.|We measured energy use at the depot.|Large crates reduce vehicle capacity.|The driver collects crates on the return journey.
How many trips will recover an investment this large?|A small deposit could cover the cost.|We calculated a net saving after repairs.|The payback period is about eight months.|Renting the depot is a fixed cost.
Repeat use is the point of a returnable crate.|We chose a durable material for the handles.|The replacement cycle depends on wear.|The return rate reached eighty per cent.|What is the lifetime cost of one crate?
We need to weigh the costs before expanding.|Compare alternatives using the same period.|What does the available evidence show?|Extra van trips create an environmental trade-off.|Storage space is a practical constraint.`),
  week(`Pick a role card without showing your partner.|The practice scenario involves a missed train.|I will take the customer role first.|Read the sample response after your attempt.|Try the same skill in an unfamiliar setting.
Our learning objective is to confirm changed details.|Specific feedback helped me check the date.|I used a shorter question on my next attempt.|Did you notice an improvement this time?|Small successful conversations build confidence.
The customer made an unexpected request.|A real caller may change the subject.|Stop and ask a relevant question.|Before you book, check the details.|Both people helped reach a solution.
What is the customer's underlying problem?|Record the customer preference in your note.|A lift is a practical need for this visitor.|We uncovered a hidden assumption about the date.|Listen for clues before suggesting a room.
Good listeners respond flexibly when plans change.|We switch roles after four minutes.|You can revise a reply after a follow-up.|An unplanned question revealed a mistake.|Did the new information affect your decision?
One assessment criterion is whether the visitor can act.|A booking confirmation is an observable action.|Both people agreed on a successful outcome.|The final round is independent practice.|Can you transfer a skill to a different task?`),
  week(`The inspection date is still provisional.|Post the reopening schedule by the entrance.|We called an available contractor.|Who gives the necessary approval?|The booking calendar lists three rehearsals.
The hall needs an official inspection.|Ask for a written guarantee of the date.|The new vent must meet the safety standard.|We need formal permission to reopen.|All contractors must comply with rules on noise.
The quote includes three days of room hire.|A cancellation cost applies after Friday.|The hall will lose rental income.|Moving the concert creates an additional expense.|Compare total costs before selecting a contractor.
The charity concert has printed tickets.|The public performance cannot change dates.|Keep your printed ticket for the new venue.|A prior commitment prevents me from attending.|Each affected booking needs a separate reply.
We reserved a backup venue for the choir.|The revised rehearsal starts at four.|An alternative contractor can inspect on Thursday.|We have reserve funds for a second fan.|Call the emergency contact if the vent fails.
Meet on Friday to review the options.|We should request written evidence of approval.|Can we agree a timetable with the engineer?|Set a realistic deadline for reopening.|The committee needs a final recommendation.`),
  week(`The published notice lists the usual hours.|The original leaflet was printed in March.|Check the publication date before relying on it.|The current schedule includes Sunday mornings.|Call the office to verify a detail.
Outdated guidance sent us to the wrong gate.|Have you seen the recent update?|An official announcement is due at noon.|Use the latest edition of the map.|The date of issue is beside the title.
We received conflicting reports about the trail.|Historical context explains the old hours.|The notices refer to different time frames.|The ranger corrected an earlier statement.|The dates help reconcile two accounts.
A temporary closure affects the lower path.|Normal operating hours resume next week.|Today's closure is a limited exception.|The river path has a seasonal restriction.|Which specific circumstance caused the change?
A first-hand account came from a ranger.|We need a dated record of the decision.|An independent source confirmed the storm damage.|An editorial correction changed the time.|Public information should distinguish plans from facts.
The walk will start at ten, weather permitting.|The morning route is a provisional arrangement.|We still await confirmation from the ranger.|A further inspection is scheduled at noon.|What is the current condition of the bridge?`),
  week(`The pilot scheme involved thirty households.|Our project proposal includes shared parking.|A local trial could test demand this winter.|I would suggest a change to the survey.|Our working hypothesis concerns shorter journeys.
A small sample limits this comparison.|The short observation period missed winter travel.|Volunteer bias may affect our results.|Weather was an unmeasured factor.|Treat the first count as a preliminary result.
Do not assume a link without checking alternatives.|Can the diaries challenge a belief about car use?|We need a second study to test an idea.|It is reasonable to question a premise.|Please state an assumption behind the estimate.
Weather conditions changed during the trial.|Walking to work was an existing habit.|A new cycle path changed my travel choice.|Residents asked for secure parking.|The diary records each journey purpose.
Can you give a rationale for the invitation method?|Please cite an observation from the diary.|We must assess the trade-off between cost and reach.|Two findings support a recommendation for another trial.|What criticism should we anticipate before publication?
Each household received a random invitation from the address list.|Every trial participant received a diary.|A household may reject an invitation.|Ask the rider to record an alternative for each trip.|We should review participation across neighbourhoods.`),
  week(`My job interview starts at two.|The selection panel has three members.|The candidate profile lists relevant skills.|Read the job description before choosing an example.|I prepared a short work sample.
The missing certificate is an unexpected development.|We get two minutes of time to prepare.|It is fine to pause briefly before answering.|You can ask for a moment to think.|Try to respond directly to the new information.
The interviewer explained a technical term.|Could you use plain language to describe the risk?|I need a precise definition of urgent.|May I confirm the scope of the task?|Please explain an abbreviation on the form.
A cancelled delivery could change your approach.|The risk made me reconsider a choice.|I need to revise an estimate of the cost.|Good candidates respond to evidence.|Can you explain a change in your reasoning?
A persuasive argument mentions a real trade-off.|May I address an objection about timing?|One supporting detail is the inspection date.|What is your preferred approach now?|Can you offer a practical solution this week?
We must weigh risks before ordering.|Consider consequences for the next shift.|I would evaluate alternatives with the team.|We have enough information to make a judgement.|Could you justify a priority without using jargon?`),
  week(`The centre charges a small booking fee.|The refund condition appears on every ticket.|An eligible booking gets its deposit back.|A late cancellation may qualify for a partial refund.|The qualifying period ends at noon.
Read the entrance notice before paying.|Staff revised the public guidance.|The key instruction belongs at the top.|What is the refund deadline?|Add a practical example for a late booking.
Precise wording can prevent an argument.|The editor removed an ambiguous phrase.|The word it needs a clear reference.|Give a specific instruction for a late arrival.|Parents are the intended audience for this notice.
Visitor feedback showed that the rule was unclear.|We owe the guest a formal reply.|Can you address a query about refunds?|Please acknowledge receipt of my email.|We can revise a notice after the trial.
Could you outline a policy for late arrivals?|Present the evidence before drawing a conclusion.|We report attendance separately from bookings.|Use one sentence to describe an exception.|Please list the conditions for a full refund.
You may transfer the ticket provided that a seat is free.|A different date is offered subject to availability.|The code is valid until noon.|A replacement visitor took the place.|A manager will review the disputed case.`),
  week(`The timed task starts when you open the prompt.|I wrote a practice essay on local transport.|The marking guide lists four criteria.|Each candidate response is read twice.|I tried the task under exam conditions.
The planning stage took four minutes.|My opening paragraph states the position.|Leave time for a final check.|Use the remaining minutes to check references.|Allow time for editing at the end.
My recurring error is mixing by and to.|I corrected a grammar mistake in the second sentence.|A weak example made the paragraph less clear.|Replace an unsupported claim with a specific case.|The marker spotted a logical gap between two ideas.
Time pressure affected my final paragraph.|A strict deadline kept the task realistic.|Short notes helped me work efficiently.|I prioritise content before polishing the wording.|Can you complete a draft before the timer ends?
A second marker read the essay independently.|The two readers compare scores after marking.|They use agreed criteria for every script.|A third reader may review a discrepancy.|Anonymous marking hides the writer's identity.
One more clear example is a realistic goal.|Targeted revision focuses on my weakest paragraph.|Try a fresh prompt before reading the model.|A new question helps check for transfer.|We monitor improvement with repeated fresh tasks.`),
  week(`The outgoing coordinator left a short guide.|My successor starts next week.|The report explains the project closure.|We transfer ownership of the log on Friday.|A written handover should identify the approver.
Keep this recording as your baseline performance.|The final round is an independent task.|A new problem gives us fresh evidence.|We compare attempts from different weeks.|The new rubric helps identify improvement.
Mark any uncertain instruction with a question.|Please ask who approves extra costs.|I called the manager to confirm a limit.|Can you locate a record of the last order?|We need to verify authority before paying.
Both teams can read the shared log.|The repair history lists an earlier fault.|Please update an entry when a part arrives.|You can log a refusal without recording a name.|The approval emails form an audit trail.
Who will carry out a decision after the meeting?|The chair will assign ownership of the repair.|Call on Friday to check the outcome.|I need the invoice to complete the action.|Please report back when the new team has tested it.
My plan for future learning includes weekly calls.|I wrote a weekly reflection in English.|I managed an independent conversation at the station.|An unfamiliar caller gave me a new challenge.|Short regular practice helps sustain progress.`),
];
